'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import type { GalleryImage } from '@/lib/types'
import { storageUrl, BLUR_PLACEHOLDER } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'

interface ArtworkButtonProps {
  image: GalleryImage
  onClick?: () => void
  className: string
  /** Layout-variant styles merged over the shared base (aspect ratio, reveal state, …) */
  style?: React.CSSProperties
  sizes: string
  priority?: boolean
}

// FIXED: shared clickable-artwork base — GalleryCard and FlowLayout's private
// FlowImage duplicated the button + NextImage + blur + onError-hide block, differing
// only in sizing/reveal styles, which now arrive via className/style/sizes props.
export default function ArtworkButton({
  image,
  onClick,
  className,
  style,
  sizes,
  priority = false,
}: ArtworkButtonProps) {
  const [missing, setMissing] = useState(false)
  if (missing) return null

  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={imageLabel(image)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        padding: 0,
        background: 'var(--img-skeleton)',
        ...style,
      }}
    >
      <NextImage
        src={storageUrl(image.storage_path)}
        alt={imageLabel(image)}
        fill
        sizes={sizes}
        className="card-img"
        style={{ objectFit: 'cover' }}
        placeholder="blur"
        blurDataURL={image.blur_data_url ?? BLUR_PLACEHOLDER}
        priority={priority}
        onError={() => setMissing(true)}
      />
    </button>
  )
}
