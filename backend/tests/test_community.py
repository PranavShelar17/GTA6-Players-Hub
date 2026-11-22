import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_community_categories(async_client: AsyncClient):
    """Verifies that categories endpoint returns all 10 approved categories."""
    res = await async_client.get("/api/v1/community/categories")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 10
    slugs = [c["slug"] for c in data]
    assert "general-discussion" in slugs
    assert "gameplay-discussion" in slugs
    assert "story-characters" in slugs
    assert "vehicles-customisation" in slugs
    assert "community-polls" in slugs


@pytest.mark.asyncio
async def test_post_lifecycle(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests creating, fetching, updating, and deleting a post with ownership enforcement."""
    # First get categories
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    # 1. Create post
    payload = {
        "title": "Vice City Waterfront Driving Mechanics",
        "content": "Discussing the ocean physics and how supercars handle near Ocean Beach.",
        "category_id": cat_id,
        "media_urls": [],
    }
    create_res = await async_client.post("/api/v1/community/posts", json=payload, headers=auth_headers_user1)
    assert create_res.status_code == 201
    post_data = create_res.json()["data"]
    post_id = post_data["id"]
    assert post_data["title"] == "Vice City Waterfront Driving Mechanics"
    assert post_data["is_author"] is True

    # 2. Detail view
    detail_res = await async_client.get(f"/api/v1/community/posts/{post_id}", headers=auth_headers_user1)
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["views_count"] >= 1

    # 3. Unauthorized edit by user2
    unauth_edit = await async_client.patch(
        f"/api/v1/community/posts/{post_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers_user2,
    )
    assert unauth_edit.status_code == 403

    # 4. Authorized edit by user1
    auth_edit = await async_client.patch(
        f"/api/v1/community/posts/{post_id}",
        json={"title": "Updated Waterfront Driving Mechanics"},
        headers=auth_headers_user1,
    )
    assert auth_edit.status_code == 200
    assert auth_edit.json()["data"]["title"] == "Updated Waterfront Driving Mechanics"

    # 5. Unauthorized delete by user2
    unauth_del = await async_client.delete(f"/api/v1/community/posts/{post_id}", headers=auth_headers_user2)
    assert unauth_del.status_code == 403

    # 6. Authorized delete by user1
    auth_del = await async_client.delete(f"/api/v1/community/posts/{post_id}", headers=auth_headers_user1)
    assert auth_del.status_code == 200

    # 7. Post should now be 404
    get_del = await async_client.get(f"/api/v1/community/posts/{post_id}")
    assert get_del.status_code == 404


@pytest.mark.asyncio
async def test_post_media_and_poll(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests creating a post with attached poll and multiple users voting."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    post_payload = {
        "title": "Which weapon class will you main in Leonida?",
        "content": "Assault rifles, handguns, heavy ordnance or melee weapons?",
        "category_id": cat_id,
        "media_urls": ["/uploads/community/sample1.webp"],
        "poll": {
            "question": "Choose your primary weapon class:",
            "allow_vote_change": True,
            "options": ["Handguns & Revolvers", "Assault Rifles", "Shotguns", "Heavy Ordnance"],
        },
    }
    create_res = await async_client.post("/api/v1/community/posts", json=post_payload, headers=auth_headers_user1)
    assert create_res.status_code == 201
    post = create_res.json()["data"]
    poll = post["poll"]
    assert poll is not None
    assert len(poll["options"]) == 4
    poll_id = poll["id"]
    option1_id = poll["options"][0]["id"]
    option2_id = poll["options"][1]["id"]

    # User 1 votes option 1
    vote1_res = await async_client.post(
        f"/api/v1/community/polls/{poll_id}/vote",
        json={"option_id": option1_id},
        headers=auth_headers_user1,
    )
    assert vote1_res.status_code == 200
    poll_data1 = vote1_res.json()["data"]
    assert poll_data1["total_votes"] == 1
    assert poll_data1["user_voted_option_id"] == option1_id

    # User 2 votes option 2
    vote2_res = await async_client.post(
        f"/api/v1/community/polls/{poll_id}/vote",
        json={"option_id": option2_id},
        headers=auth_headers_user2,
    )
    assert vote2_res.status_code == 200
    poll_data2 = vote2_res.json()["data"]
    assert poll_data2["total_votes"] == 2

    # User 1 changes vote to option 2 (allowed)
    change_res = await async_client.post(
        f"/api/v1/community/polls/{poll_id}/vote",
        json={"option_id": option2_id},
        headers=auth_headers_user1,
    )
    assert change_res.status_code == 200
    poll_data_changed = change_res.json()["data"]
    assert poll_data_changed["total_votes"] == 2
    assert poll_data_changed["user_voted_option_id"] == option2_id


@pytest.mark.asyncio
async def test_like_unlike_toggle(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests atomic like/unlike toggle and likes counter."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Excited for Vice City radio stations!", "content": "Flash FM vibes are needed in Leonida.", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    # User 2 likes post
    like_res = await async_client.post(f"/api/v1/community/posts/{post_id}/like", headers=auth_headers_user2)
    assert like_res.status_code == 200
    assert like_res.json()["data"]["is_liked"] is True
    assert like_res.json()["data"]["likes_count"] == 1

    # User 2 unlikes post
    unlike_res = await async_client.delete(f"/api/v1/community/posts/{post_id}/like", headers=auth_headers_user2)
    assert unlike_res.status_code == 200
    assert unlike_res.json()["data"]["is_liked"] is False
    assert unlike_res.json()["data"]["likes_count"] == 0


@pytest.mark.asyncio
async def test_comment_and_reply_threading(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests adding top-level comments and 1-level reply threading."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Customization options in GTA 6", "content": "Will we be able to paint brake calipers?", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    # User 2 posts top-level comment
    comment_res = await async_client.post(
        f"/api/v1/community/posts/{post_id}/comments",
        json={"content": "Yes, brake caliper customization was spotted in leak analysis!"},
        headers=auth_headers_user2,
    )
    assert comment_res.status_code == 201
    comment_id = comment_res.json()["data"]["id"]

    # User 1 replies to User 2's comment
    reply_res = await async_client.post(
        f"/api/v1/community/posts/{post_id}/comments",
        json={"content": "That is awesome to hear!", "parent_comment_id": comment_id},
        headers=auth_headers_user1,
    )
    assert reply_res.status_code == 201

    # Fetch comments
    list_comments_res = await async_client.get(f"/api/v1/community/posts/{post_id}/comments", headers=auth_headers_user1)
    assert list_comments_res.status_code == 200
    comments = list_comments_res.json()["data"]
    assert len(comments) == 1
    assert comments[0]["id"] == comment_id
    assert len(comments[0]["replies"]) == 1
    assert comments[0]["replies"][0]["content"] == "That is awesome to hear!"


@pytest.mark.asyncio
async def test_bookmark_lifecycle(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests saving and retrieving bookmarks."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Bookmarkable Post", "content": "Important launch guide.", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    # User 2 bookmarks post
    bm_res = await async_client.post(f"/api/v1/community/posts/{post_id}/bookmark", headers=auth_headers_user2)
    assert bm_res.status_code == 200
    assert bm_res.json()["data"]["is_bookmarked"] is True

    # User 2 checks bookmarks list
    list_bm = await async_client.get("/api/v1/community/bookmarks", headers=auth_headers_user2)
    assert list_bm.status_code == 200
    assert len(list_bm.json()["data"]) == 1
    assert list_bm.json()["data"][0]["id"] == post_id

    # User 2 removes bookmark
    un_bm = await async_client.delete(f"/api/v1/community/posts/{post_id}/bookmark", headers=auth_headers_user2)
    assert un_bm.status_code == 200
    assert un_bm.json()["data"]["is_bookmarked"] is False


@pytest.mark.asyncio
async def test_follow_and_following_feed(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests following a player and seeing their posts in the following feed."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    # Ensure profile for user1
    sync_res = await async_client.post(
        "/api/v1/users/sync",
        json={"email": "player1@example.com", "username": "pro_player1"},
        headers=auth_headers_user1,
    )

    # User 1 creates post
    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Following Only Post", "content": "Post from followed player.", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    # User 2 checks following feed before follow -> empty
    f_before = await async_client.get("/api/v1/community/posts?feed_type=following", headers=auth_headers_user2)
    assert len(f_before.json()["data"]) == 0

    # User 2 follows User 1
    follow_res = await async_client.post(
        "/api/v1/community/player/11111111-1111-1111-1111-111111111111/follow",
        headers=auth_headers_user2,
    )
    assert follow_res.status_code == 200
    assert follow_res.json()["data"]["is_following"] is True

    # User 2 checks following feed after follow -> post visible
    f_after = await async_client.get("/api/v1/community/posts?feed_type=following", headers=auth_headers_user2)
    assert len(f_after.json()["data"]) == 1
    assert f_after.json()["data"][0]["id"] == post_id


@pytest.mark.asyncio
async def test_block_player_content_hiding(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests that blocking a player immediately hides their posts from the feed."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Blocked Post Content", "content": "This post should be hidden after block.", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    # Before block: User 2 sees it
    res1 = await async_client.get("/api/v1/community/posts", headers=auth_headers_user2)
    post_ids = [p["id"] for p in res1.json()["data"]]
    assert post_id in post_ids

    # User 2 blocks User 1
    block_res = await async_client.post(
        "/api/v1/community/player/11111111-1111-1111-1111-111111111111/block",
        headers=auth_headers_user2,
    )
    assert block_res.status_code == 200
    assert block_res.json()["data"]["is_blocked"] is True

    # After block: User 2's feed no longer includes user1's post
    res2 = await async_client.get("/api/v1/community/posts", headers=auth_headers_user2)
    post_ids2 = [p["id"] for p in res2.json()["data"]]
    assert post_id not in post_ids2


@pytest.mark.asyncio
async def test_community_report(async_client: AsyncClient, auth_headers_user1, auth_headers_user2):
    """Tests filing a moderation report."""
    cat_res = await async_client.get("/api/v1/community/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    create_res = await async_client.post(
        "/api/v1/community/posts",
        json={"title": "Spam Content Title", "content": "Buy cheap fake coins at example.com", "category_id": cat_id},
        headers=auth_headers_user1,
    )
    post_id = create_res.json()["data"]["id"]

    rep_payload = {
        "target_type": "POST",
        "target_id": post_id,
        "reason": "SPAM",
        "description": "User is advertising external scam websites.",
    }
    rep_res = await async_client.post("/api/v1/community/reports", json=rep_payload, headers=auth_headers_user2)
    assert rep_res.status_code == 201
    assert rep_res.json()["data"]["report_status"] == "PENDING"
