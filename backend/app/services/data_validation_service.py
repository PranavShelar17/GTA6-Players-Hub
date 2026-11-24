import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# Allowed tracking parameters stripped during normalization
TRACKING_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "ref",
    "ref_src",
    "_ga",
    "mc_cid",
    "mc_eid",
}

APPROVED_VERIFICATION_LABELS = {"OFFICIAL", "VERIFIED", "RUMOUR", "UNCONFIRMED"}
APPROVED_CURRENCIES = {"INR", "USD", "GBP", "EUR", "AED"}
APPROVED_COUNTRY_CODES = {"IND", "USA", "GBR", "EUR", "ARE"}
APPROVED_PLATFORMS = {"PlayStation 5", "Xbox Series X/S", "PC"}
APPROVED_EDITIONS = {"Standard Edition", "Special Edition", "Ultimate Edition", "Collector's Edition"}


class DataValidationService:
    """Reusable data quality, normalization, and deduplication engine."""

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        """Normalizes a URL by stripping tracking parameters, trailing slashes, fragments, and standardizing host."""
        if not raw_url or not isinstance(raw_url, str):
            return ""
        clean_url = raw_url.strip()
        try:
            parsed = urlparse(clean_url)
            if not parsed.scheme or not parsed.netloc:
                return clean_url

            filtered_query = [
                (k, v)
                for k, v in parse_qsl(parsed.query, keep_blank_values=True)
                if k.lower() not in TRACKING_PARAMS
            ]
            new_query = urlencode(filtered_query)
            normalized_path = parsed.path.rstrip("/").lower() if parsed.path != "/" else "/"

            normalized = urlunparse((
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                normalized_path,
                "",  # params
                new_query,
                "",  # fragment stripped
            ))
            return normalized
        except Exception:
            return clean_url

    @staticmethod
    def validate_url(url: str) -> Tuple[bool, Optional[str]]:
        """Validates that a string is a well-formed HTTP/HTTPS URL."""
        if not url or not isinstance(url, str):
            return False, "URL is required and must be a non-empty string"
        try:
            parsed = urlparse(url.strip())
            if parsed.scheme.lower() not in ("http", "https"):
                return False, f"URL scheme must be http or https, got '{parsed.scheme}'"
            if not parsed.netloc:
                return False, "URL missing domain or host"
            return True, None
        except Exception as e:
            return False, f"Malformed URL: {str(e)}"

    @staticmethod
    def validate_timestamp(raw_dt: Any) -> Tuple[bool, Optional[datetime], Optional[str]]:
        """Parses and validates a date/time, returning a timezone-aware UTC datetime."""
        if raw_dt is None:
            return False, None, "Timestamp cannot be null"

        if isinstance(raw_dt, datetime):
            if raw_dt.tzinfo is None:
                # Naive datetime: assume UTC
                dt_utc = raw_dt.replace(tzinfo=timezone.utc)
            else:
                dt_utc = raw_dt.astimezone(timezone.utc)
            return True, dt_utc, None

        if isinstance(raw_dt, str):
            raw_str = raw_dt.strip()
            # Try RFC 2822 / 822 formats (e.g. RSS pubDate: 'Fri, 20 Nov 2026 18:28:32 +0000')
            try:
                from email.utils import parsedate_to_datetime
                dt_parsed = parsedate_to_datetime(raw_str)
                if dt_parsed is not None:
                    if dt_parsed.tzinfo is None:
                        dt_parsed = dt_parsed.replace(tzinfo=timezone.utc)
                    else:
                        dt_parsed = dt_parsed.astimezone(timezone.utc)
                    return True, dt_parsed, None
            except Exception:
                pass

            # Try ISO formats
            for fmt in (
                "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S.%f%z",
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d",
            ):
                try:
                    dt = datetime.strptime(raw_str, fmt)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    else:
                        dt = dt.astimezone(timezone.utc)
                    return True, dt, None
                except ValueError:
                    continue
            return False, None, f"Unrecognized date format: '{raw_str}'"

        return False, None, f"Unsupported timestamp type: {type(raw_dt).__name__}"

    @staticmethod
    def validate_currency(currency_code: str, country_code: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """Validates 3-letter currency code and optional region alignment."""
        if not currency_code or not isinstance(currency_code, str):
            return False, "Currency code is required"
        code = currency_code.strip().upper()
        if len(code) != 3:
            return False, f"Currency code must be 3 letters (ISO 4217), got '{code}'"
        if code not in APPROVED_CURRENCIES:
            return False, f"Currency '{code}' is not in approved currencies: {', '.join(sorted(APPROVED_CURRENCIES))}"

        if country_code:
            expected = {
                "IND": "INR",
                "USA": "USD",
                "GBR": "GBP",
                "EUR": "EUR",
                "ARE": "AED",
            }.get(country_code.strip().upper())
            if expected and expected != code:
                return False, f"Currency '{code}' does not match region '{country_code}' (expected '{expected}')"

        return True, None

    @staticmethod
    def validate_price_values(
        current_price: Any,
        original_price: Optional[Any] = None,
    ) -> Tuple[bool, Optional[Decimal], Optional[Decimal], Optional[Decimal], Optional[str]]:
        """
        Validates price numbers. Ensures current >= 0, original >= current if supplied.
        Calculates genuine discount percentage: (original - current) / original * 100.
        Returns: (is_valid, current_decimal, original_decimal, discount_pct, error_msg)
        """
        try:
            curr_dec = Decimal(str(current_price)).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError, TypeError):
            return False, None, None, None, f"Invalid current price value: {current_price}"

        if curr_dec < Decimal("0.00"):
            return False, None, None, None, f"Current price cannot be negative: {curr_dec}"

        orig_dec: Optional[Decimal] = None
        discount_pct: Optional[Decimal] = None

        if original_price is not None and str(original_price).strip() != "":
            try:
                orig_dec = Decimal(str(original_price)).quantize(Decimal("0.01"))
            except (InvalidOperation, ValueError, TypeError):
                return False, None, None, None, f"Invalid original price value: {original_price}"

            if orig_dec < curr_dec:
                return False, None, None, None, f"Original price ({orig_dec}) cannot be less than current price ({curr_dec})"

            if orig_dec > curr_dec and orig_dec > 0:
                raw_pct = ((orig_dec - curr_dec) / orig_dec) * Decimal("100")
                discount_pct = raw_pct.quantize(Decimal("0.01"))

        return True, curr_dec, orig_dec, discount_pct, None

    @staticmethod
    def validate_news_item(item: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """Validates, sanitizes, and normalizes an incoming news item dictionary."""
        errors: List[str] = []
        normalized: Dict[str, Any] = {}

        # 1. Title
        title = item.get("title")
        if not title or not isinstance(title, str) or len(title.strip()) < 5:
            errors.append("Article title is required and must be at least 5 characters")
        else:
            normalized["title"] = title.strip()

        # 2. Source URL & Canonical URL
        raw_url = item.get("source_url") or item.get("url")
        url_valid, url_err = DataValidationService.validate_url(raw_url)
        if not url_valid:
            errors.append(f"Invalid source URL: {url_err}")
        else:
            normalized["source_url"] = raw_url.strip()
            normalized["canonical_url"] = DataValidationService.normalize_url(raw_url)

        # 3. Source Name
        source_name = item.get("source_name") or item.get("source")
        if not source_name or not isinstance(source_name, str):
            errors.append("source_name is required")
        else:
            normalized["source_name"] = source_name.strip()

        # 4. Publication Date
        raw_dt = item.get("published_at") or item.get("publication_date")
        dt_valid, dt_val, dt_err = DataValidationService.validate_timestamp(raw_dt)
        if not dt_valid:
            errors.append(f"Invalid publication date: {dt_err}")
        else:
            normalized["published_at"] = dt_val

        # 5. Verification status
        raw_status = (item.get("verification_status") or "UNCONFIRMED").strip().upper()
        if raw_status not in APPROVED_VERIFICATION_LABELS:
            errors.append(f"Invalid verification status '{raw_status}'. Must be one of: {', '.join(APPROVED_VERIFICATION_LABELS)}")
        else:
            normalized["verification_status"] = raw_status

        # 6. Optional summary & content
        summary = item.get("summary") or item.get("short_summary") or ""
        normalized["summary"] = summary.strip()[:1000] if isinstance(summary, str) else ""

        content = item.get("content") or item.get("markdown_content") or normalized["summary"]
        normalized["content"] = content.strip() if isinstance(content, str) else ""

        category_slug = item.get("category_slug") or "official-announcements"
        normalized["category_slug"] = str(category_slug).strip().lower()

        return len(errors) == 0, normalized, errors

    @staticmethod
    def validate_price_observation(item: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """Validates and normalizes an incoming price observation dictionary."""
        errors: List[str] = []
        normalized: Dict[str, Any] = {}

        # 1. Product identity
        product_slug = item.get("product_slug")
        product_id = item.get("product_id")
        if not product_slug and not product_id:
            errors.append("Product identity (product_slug or product_id) is required")
        else:
            normalized["product_slug"] = str(product_slug).strip().lower() if product_slug else None
            normalized["product_id"] = str(product_id).strip() if product_id else None

        # 2. Store Name
        store_name = item.get("store_name")
        if not store_name or not isinstance(store_name, str):
            errors.append("Store name is required")
        else:
            normalized["store_name"] = store_name.strip()

        # 3. Country / Region Code
        country_code = item.get("country_code") or item.get("region_code")
        if not country_code or not isinstance(country_code, str):
            errors.append("country_code is required")
        else:
            code_upper = country_code.strip().upper()
            if code_upper not in APPROVED_COUNTRY_CODES:
                errors.append(f"Invalid country_code '{code_upper}'. Must be one of: {', '.join(APPROVED_COUNTRY_CODES)}")
            else:
                normalized["country_code"] = code_upper

        # 4. Currency
        currency_code = item.get("currency_code") or item.get("currency")
        curr_valid, curr_err = DataValidationService.validate_currency(currency_code, normalized.get("country_code"))
        if not curr_valid:
            errors.append(f"Invalid currency: {curr_err}")
        else:
            normalized["currency_code"] = currency_code.strip().upper()

        # 5. Price values
        raw_price = item.get("current_price") or item.get("price")
        raw_orig = item.get("original_price")
        p_valid, curr_dec, orig_dec, disc_pct, p_err = DataValidationService.validate_price_values(raw_price, raw_orig)
        if not p_valid:
            errors.append(f"Price validation error: {p_err}")
        else:
            normalized["current_price"] = curr_dec
            normalized["original_price"] = orig_dec
            normalized["discount_percentage"] = disc_pct

        # 6. Availability & Store URL
        normalized["is_available"] = bool(item.get("is_available", True))
        url = item.get("store_url") or item.get("url") or ""
        normalized["store_url"] = DataValidationService.normalize_url(url) if url else None

        # 7. Observed At
        observed_at_raw = item.get("observed_at") or item.get("retrieval_timestamp") or datetime.now(timezone.utc)
        dt_valid, dt_val, dt_err = DataValidationService.validate_timestamp(observed_at_raw)
        if not dt_valid:
            errors.append(f"Invalid observation timestamp: {dt_err}")
        else:
            normalized["observed_at"] = dt_val

        return len(errors) == 0, normalized, errors

    @staticmethod
    def validate_event_item(item: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """Validates and normalizes an incoming event item dictionary."""
        errors: List[str] = []
        normalized: Dict[str, Any] = {}

        # 1. Title
        title = item.get("title")
        if not title or not isinstance(title, str) or len(title.strip()) < 5:
            errors.append("Event title is required and must be at least 5 characters")
        else:
            normalized["title"] = title.strip()

        # 2. Slug
        slug = item.get("slug")
        if slug:
            normalized["slug"] = re.sub(r"[^a-z0-9\-]", "", str(slug).strip().lower().replace(" ", "-"))
        elif title:
            base = re.sub(r"[^a-z0-9\-]", "", title.lower().replace(" ", "-"))
            normalized["slug"] = base[:100]

        # 3. Start Time & End Time
        start_time_raw = item.get("start_time")
        st_valid, st_val, st_err = DataValidationService.validate_timestamp(start_time_raw)
        if not st_valid:
            errors.append(f"Invalid event start_time: {st_err}")
        else:
            normalized["start_time"] = st_val

        end_time_raw = item.get("end_time")
        if end_time_raw:
            et_valid, et_val, et_err = DataValidationService.validate_timestamp(end_time_raw)
            if not et_valid:
                errors.append(f"Invalid event end_time: {et_err}")
            elif st_val and et_val < st_val:
                errors.append(f"Event end_time ({et_val}) cannot be earlier than start_time ({st_val})")
            else:
                normalized["end_time"] = et_val
        else:
            normalized["end_time"] = None

        # 4. Timezone & URLs
        normalized["timezone"] = str(item.get("timezone", "UTC")).strip()
        normalized["location_type"] = str(item.get("location_type", "ONLINE")).strip().upper()
        normalized["location_name"] = str(item.get("location_name", "Online Broadcast")).strip()
        normalized["event_url"] = DataValidationService.normalize_url(item.get("event_url", "")) or None
        normalized["stream_url"] = DataValidationService.normalize_url(item.get("stream_url", "")) or None
        normalized["source_name"] = str(item.get("source_name", "Official Source")).strip()
        normalized["category_slug"] = str(item.get("category_slug", "official-broadcasts")).strip().lower()

        # 5. Verification status
        raw_status = (item.get("verification_status") or "OFFICIAL").strip().upper()
        if raw_status not in APPROVED_VERIFICATION_LABELS:
            errors.append(f"Invalid verification status '{raw_status}'")
        else:
            normalized["verification_status"] = raw_status

        normalized["short_summary"] = str(item.get("short_summary", "")).strip()[:500]
        normalized["description"] = str(item.get("description", normalized["short_summary"])).strip()
        normalized["is_cancelled"] = bool(item.get("is_cancelled", False))

        return len(errors) == 0, normalized, errors
