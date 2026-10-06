import re
import socket
import ipaddress
from urllib.parse import urlparse, parse_qs
from typing import Tuple, Optional
from fastapi import HTTPException, status

PROHIBITED_HOSTNAMES = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}

YOUTUBE_DOMAINS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}

INSTAGRAM_DOMAINS = {
    "instagram.com",
    "www.instagram.com",
    "m.instagram.com",
    "instagr.am",
}

YOUTUBE_VIDEO_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{10,15}$")
INSTAGRAM_SHORTCODE_REGEX = re.compile(r"^[a-zA-Z0-9_-]{5,35}$")


def is_ip_prohibited(ip_str: str) -> bool:
    """Check if an IP is private, loopback, link-local, multicast, or reserved."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        )
    except ValueError:
        return True


def check_ssrf_and_dns(hostname: str) -> None:
    """
    Enforces SSRF defense by resolving the hostname and ensuring all resolved
    IP addresses are public, non-loopback, and non-private.
    """
    cleaned = hostname.lower().strip()
    if cleaned in PROHIBITED_HOSTNAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or prohibited URL: loopback addresses are not permitted.",
        )

    try:
        addr_info = socket.getaddrinfo(cleaned, None)
        for entry in addr_info:
            ip_cand = entry[4][0]
            if is_ip_prohibited(ip_cand):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or prohibited URL: private/internal network addresses are not permitted.",
                )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to resolve hostname '{cleaned}'. Please check the URL.",
        )


def validate_and_normalize_video_url(raw_url: str) -> Tuple[str, str, str]:
    """
    Validates, security-checks, and normalizes a user-supplied YouTube or Instagram URL.

    Returns:
        (normalized_url, platform, video_id)

    Raises:
        HTTPException with clean, user-friendly descriptions.
    """
    if not raw_url or not raw_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid YouTube or Instagram URL.",
        )

    url = raw_url.strip()

    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed URL format. Please provide a valid URL.",
        )

    # 1. Enforce scheme (HTTP/HTTPS only)
    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported protocol. Only HTTP and HTTPS URLs are permitted.",
        )

    # 2. Hostname validation
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid YouTube or Instagram URL with a valid domain.",
        )

    hostname_lower = hostname.lower()

    # 3. SSRF & IP address check
    check_ssrf_and_dns(hostname_lower)

    path = parsed.path
    query = parse_qs(parsed.query)

    # 4. YouTube Domain handling
    if hostname_lower in YOUTUBE_DOMAINS:
        video_id: Optional[str] = None

        if hostname_lower == "youtu.be":
            # Format: https://youtu.be/<video_id>
            parts = [p for p in path.split("/") if p]
            if parts:
                video_id = parts[0]
        else:
            # Format 1: /watch?v=<video_id>
            if path.startswith("/watch"):
                v_param = query.get("v")
                if v_param and len(v_param) > 0:
                    video_id = v_param[0]
            # Format 2: /shorts/<video_id>
            elif "/shorts/" in path:
                parts = path.split("/shorts/")[1].split("/")
                if parts and parts[0]:
                    video_id = parts[0]
            # Format 3: /embed/<video_id>
            elif "/embed/" in path:
                parts = path.split("/embed/")[1].split("/")
                if parts and parts[0]:
                    video_id = parts[0]

        if not video_id or not YOUTUBE_VIDEO_ID_REGEX.match(video_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube video URL. Supported: youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...",
            )

        normalized_url = f"https://www.youtube.com/watch?v={video_id}"
        return normalized_url, "YouTube", video_id

    # 5. Instagram Domain handling
    elif hostname_lower in INSTAGRAM_DOMAINS:
        shortcode: Optional[str] = None

        # Instagram URL paths: /reel/<shortcode>/, /p/<shortcode>/, /tv/<shortcode>/
        match = re.search(r"/(reel|p|tv)/([a-zA-Z0-9_-]+)", path)
        if match:
            shortcode = match.group(2)

        if not shortcode or not INSTAGRAM_SHORTCODE_REGEX.match(shortcode):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Instagram video URL. Supported: instagram.com/reel/..., instagram.com/p/..., or instagram.com/tv/...",
            )

        normalized_url = f"https://www.instagram.com/reel/{shortcode}/"
        return normalized_url, "Instagram", shortcode

    # 6. Reject all unsupported platforms
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This platform is not supported. Supported platforms for this phase: YouTube and Instagram.",
        )
