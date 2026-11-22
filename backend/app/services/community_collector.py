import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import (
    CommunityCategory,
    CommunityPost,
    CommunityPoll,
    CommunityPollOption,
)
from app.models.user import PlayerProfile

# 10 Approved Community Categories
APPROVED_CATEGORIES = [
    {
        "name": "General Discussion",
        "slug": "general-discussion",
        "description": "General discussions, theories, and talk about Grand Theft Auto VI.",
        "icon": "message-square",
        "display_order": 1,
    },
    {
        "name": "Gameplay Discussion",
        "slug": "gameplay-discussion",
        "description": "Mechanics, gunplay, physics, stealth, and dynamic gameplay systems.",
        "icon": "gamepad-2",
        "display_order": 2,
    },
    {
        "name": "Story & Characters",
        "slug": "story-characters",
        "description": "Lucia, Jason, narrative themes, Vice City lore, and campaign speculation.",
        "icon": "book-open",
        "display_order": 3,
    },
    {
        "name": "Vehicles & Customisation",
        "slug": "vehicles-customisation",
        "description": "Cars, supercars, boats, planes, modifications, and garages in Leonida.",
        "icon": "car",
        "display_order": 4,
    },
    {
        "name": "Missions & Activities",
        "slug": "missions-activities",
        "description": "Heists, side missions, illicit activities, nightlife, and world events.",
        "icon": "crosshair",
        "display_order": 5,
    },
    {
        "name": "Gaming Setup",
        "slug": "gaming-setup",
        "description": "Show off your console and PC gaming battle stations ready for Leonida.",
        "icon": "monitor",
        "display_order": 6,
    },
    {
        "name": "Tips & Guides",
        "slug": "tips-guides",
        "description": "Preparation guides, console settings, HDR tuning, and performance tips.",
        "icon": "lightbulb",
        "display_order": 7,
    },
    {
        "name": "Questions & Help",
        "slug": "questions-help",
        "description": "Ask the player community questions regarding release, pre-orders, and editions.",
        "icon": "help-circle",
        "display_order": 8,
    },
    {
        "name": "Screenshots & Fan Content",
        "slug": "screenshots-fan-content",
        "description": "Fan art, trailer breakdowns, wallpaper captures, and creative showcases.",
        "icon": "camera",
        "display_order": 9,
    },
    {
        "name": "Community Polls",
        "slug": "community-polls",
        "description": "Official and player community polls on expectations, platforms, and preferences.",
        "icon": "bar-chart-2",
        "display_order": 10,
    },
]


async def seed_community_categories(session: AsyncSession) -> int:
    """Ensures the 10 approved categories exist in database."""
    stmt = select(CommunityCategory)
    res = await session.execute(stmt)
    existing = {cat.slug: cat for cat in res.scalars().all()}

    count = 0
    for cat_data in APPROVED_CATEGORIES:
        if cat_data["slug"] not in existing:
            cat = CommunityCategory(
                id=uuid.uuid4(),
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data["description"],
                icon=cat_data["icon"],
                display_order=cat_data["display_order"],
                is_active=True,
            )
            session.add(cat)
            count += 1

    if count > 0:
        await session.commit()
    return count


async def seed_initial_verified_posts(session: AsyncSession) -> int:
    """
    Seeds initial verified starter posts and an official poll if no posts exist.
    """
    # Check if posts already exist
    stmt = select(CommunityPost).limit(1)
    res = await session.execute(stmt)
    if res.scalar_one_or_none():
        return 0

    # Ensure categories are present
    await seed_community_categories(session)
    cat_stmt = select(CommunityCategory)
    cat_res = await session.execute(cat_stmt)
    cats = {c.slug: c for c in cat_res.scalars().all()}

    # Look up an existing player profile or create an official community ambassador
    prof_stmt = select(PlayerProfile).limit(1)
    prof_res = await session.execute(prof_stmt)
    profile = prof_res.scalar_one_or_none()

    if profile:
        author_id = profile.user_id
    else:
        author_id = uuid.uuid4()
        new_prof = PlayerProfile(
            user_id=author_id,
            username="ViceCityInsider",
            display_name="Vice City Insider",
            bio="Leonida news correspondent and GTA 6 Player Hub community moderator.",
            avatar_url="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&q=80",
            preferred_platform="PlayStation 5",
            is_verified=True,
            reputation_score=150,
        )
        session.add(new_prof)
        await session.flush()

    posts_to_create = [
        {
            "category_slug": "general-discussion",
            "title": "Welcome to the GTA 6 Player Hub Gaming Community!",
            "content": "Welcome players! This is our dedicated community space to discuss everything Grand Theft Auto VI: from Leonida's sprawling districts and Lucia & Jason's duo dynamics to vehicle tuning, heists, and launch countdowns. Be respectful, share high quality gameplay theories, and connect with fellow Vice City players.",
            "is_pinned": True,
            "likes_count": 48,
            "comments_count": 12,
            "views_count": 340,
        },
        {
            "category_slug": "gameplay-discussion",
            "title": "Dual-Protagonist Switching: Real-time inventory and combat tactics",
            "content": "Trailer 1 and Rockstar's technical breakdowns emphasize the deep dynamic relationship between Lucia and Jason. How do you envision co-op or dual tactical command working during active heist escapes? In previous GTA titles character switching was scripted during missions—do you want seamless hot-swapping or buddy command pings?",
            "is_pinned": False,
            "likes_count": 32,
            "comments_count": 8,
            "views_count": 210,
        },
        {
            "category_slug": "community-polls",
            "title": "Community Poll: Which platform will you play GTA 6 on at launch?",
            "content": "With Rockstar confirming launch on PlayStation 5 and Xbox Series X|S in Fall 2025, we want to know what platform the community will be exploring the streets of Vice City on first!",
            "is_pinned": True,
            "likes_count": 65,
            "comments_count": 19,
            "views_count": 520,
            "poll": {
                "question": "Which platform will you play GTA 6 on at launch?",
                "options": [
                    "PlayStation 5",
                    "PlayStation 5 Pro",
                    "Xbox Series X",
                    "Xbox Series S",
                    "Waiting for PC Release",
                ],
            },
        },
        {
            "category_slug": "vehicles-customisation",
            "title": "What classic Vice City vehicle do you want to see return with modern customization?",
            "content": "From the iconic Cheetah and Infernus to the classic Hermes and Cuban Hermes, Vice City had some of the most memorable rides in the franchise. With Leonida's next-generation physics and interior detailing, what vehicle are you most excited to customize first?",
            "is_pinned": False,
            "likes_count": 27,
            "comments_count": 5,
            "views_count": 180,
        },
    ]

    created_count = 0
    for pdata in posts_to_create:
        cat = cats.get(pdata["category_slug"])
        if not cat:
            continue

        post = CommunityPost(
            id=uuid.uuid4(),
            player_id=author_id,
            category_id=cat.id,
            title=pdata["title"],
            content=pdata["content"],
            post_status="PUBLISHED",
            is_pinned=pdata.get("is_pinned", False),
            likes_count=pdata.get("likes_count", 0),
            comments_count=pdata.get("comments_count", 0),
            views_count=pdata.get("views_count", 0),
        )
        session.add(post)
        await session.flush()

        if "poll" in pdata:
            poll_info = pdata["poll"]
            poll = CommunityPoll(
                id=uuid.uuid4(),
                post_id=post.id,
                question=poll_info["question"],
                allow_vote_change=True,
                total_votes=142,
            )
            session.add(poll)
            await session.flush()

            opt_counts = [58, 42, 24, 6, 12]
            for idx, opt_text in enumerate(poll_info["options"]):
                v_count = opt_counts[idx] if idx < len(opt_counts) else 0
                opt = CommunityPollOption(
                    id=uuid.uuid4(),
                    poll_id=poll.id,
                    option_text=opt_text,
                    display_order=idx + 1,
                    vote_count=v_count,
                )
                session.add(opt)

        created_count += 1

    await session.commit()
    return created_count
