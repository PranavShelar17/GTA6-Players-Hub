import React, { useState } from "react";
import { Heart } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "@/lib/priceApi";

interface PriceWishlistButtonProps {
  productId: string;
  isWishlisted?: boolean;
  token?: string | null;
  onToggle?: (wishlisted: boolean) => void;
  className?: string;
}

export function PriceWishlistButton({
  productId,
  isWishlisted = false,
  token,
  onToggle,
  className = "",
}: PriceWishlistButtonProps) {
  const [active, setActive] = useState(isWishlisted);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Please log in to add products to your wishlist.");
      return;
    }

    setLoading(true);
    const nextState = !active;
    setActive(nextState);

    try {
      if (nextState) {
        await addToWishlist(productId, token);
      } else {
        await removeFromWishlist(productId, token);
      }
      onToggle?.(nextState);
    } catch {
      setActive(!nextState); // Rollback on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-2 rounded-lg border transition-all ${
        active
          ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm shadow-rose-950/20"
          : "bg-[#12151f] border-[#202738] text-slate-400 hover:text-rose-400 hover:border-slate-600"
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${active ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
