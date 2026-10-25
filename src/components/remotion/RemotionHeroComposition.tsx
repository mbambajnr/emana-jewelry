"use client"

import React from "react"
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion"

interface SceneData {
  image: string
  title: string
  highlight: string
  description: string
  startFrame: number
  endFrame: number
}

const scenes: SceneData[] = [
  {
    image: "/hero/artisan_goldsmith.jpg",
    title: "Shop",
    highlight: "Our Jewelry",
    description: "Browse necklaces, rings, bracelets, earrings, and more.",
    startFrame: 0,
    endFrame: 120,
  },
  {
    image: "/hero/lion_medallion.jpg",
    title: "Necklaces &",
    highlight: "Pendants",
    description: "Explore the collection and ask us about any piece you like.",
    startFrame: 110,
    endFrame: 240,
  },
  {
    image: "/hero/bear_pendant.jpg",
    title: "Emana",
    highlight: "Jewelry",
    description: "Shop online or visit our store in Takoradi.",
    startFrame: 230,
    endFrame: 360,
  },
]

export default function RemotionHeroComposition() {
  const frame = useCurrentFrame()
  const { durationInFrames, width } = useVideoConfig()

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0d0d0d",
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      {scenes.map((scene, index) => {
        const isFirst = index === 0
        const isLast = index === scenes.length - 1

        // Fade in
        const fadeIn = isFirst
          ? 1
          : interpolate(frame, [scene.startFrame, scene.startFrame + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })

        // Fade out
        const fadeOut = isLast
          ? interpolate(frame, [scene.endFrame - 15, scene.endFrame], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : interpolate(frame, [scene.endFrame - 15, scene.endFrame], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })

        const opacity = Math.min(fadeIn, fadeOut)

        if (frame < scene.startFrame - 5 || frame > scene.endFrame + 5) {
          return null
        }

        // Ken Burns effect: scale from 1.0 to 1.08 over scene duration
        const localFrame = Math.max(0, frame - scene.startFrame)
        const sceneDuration = scene.endFrame - scene.startFrame
        const scale = interpolate(localFrame, [0, sceneDuration], [1.0, 1.07], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })

        // Subtle pan
        const translateY = interpolate(localFrame, [0, sceneDuration], [0, -15], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })

        // Text stagger animation
        const textY = interpolate(localFrame, [0, 20], [20, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const textOpacity = isFirst ? 1 : interpolate(localFrame, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })

        return (
          <div
            key={scene.image}
            style={{
              position: "absolute",
              inset: 0,
              opacity,
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Background Image with Ken Burns motion */}
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: index === 0 ? "center top" : index === 1 ? "center center" : "center bottom",
              }}
            >
              <Img
                src={scene.image}
                alt={scene.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </div>

            {/* Dark & Gold Cinematic Vignette Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at 50% 40%, rgba(10, 10, 10, 0.25) 0%, rgba(10, 10, 10, 0.72) 75%, rgba(5, 5, 5, 0.92) 100%)",
                mixBlendMode: "multiply",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(12, 12, 12, 0.45) 0%, rgba(12, 12, 12, 0.1) 40%, rgba(10, 10, 10, 0.85) 90%, #0a0a0a 100%)",
              }}
            />

            {/* Programmatic Animated Ambient Light Shimmer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${interpolate(frame % 180, [0, 180], [-30, 130])}%`,
                width: "35%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.08) 50%, transparent 100%)",
                transform: "skewX(-20deg)",
                pointerEvents: "none",
              }}
            />

            {/* Remotion In-Frame Content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: width < 600 ? "90px 20px 280px" : "0 2rem 100px",
                transform: `translateY(${textY}px)`,
                opacity: textOpacity,
              }}
            >
              {/* Title */}
              <h2
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: width < 600 ? "2.25rem" : "clamp(2.4rem, 5.2vw, 4.4rem)",
                  fontWeight: 500,
                  color: "#ffffff",
                  lineHeight: 1.15,
                  margin: "0 0 1rem 0",
                  maxWidth: "960px",
                  textShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
                }}
              >
                {scene.title}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #f7e0a3 0%, #d4af37 50%, #aa820a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                  }}
                >
                  {scene.highlight}
                </span>
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
                  color: "rgba(255, 255, 255, 0.88)",
                  maxWidth: "720px",
                  lineHeight: 1.6,
                  margin: "0 0 1.5rem 0",
                  textShadow: "0 2px 12px rgba(0, 0, 0, 0.8)",
                  fontWeight: 300,
                }}
              >
                {scene.description}
              </p>
            </div>
          </div>
        )
      })}

      {/* Frame Timeline Pulse Indicator at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          width: `${(frame / durationInFrames) * 100}%`,
          background: "linear-gradient(90deg, #aa820a 0%, #d4af37 50%, #f7e0a3 100%)",
          boxShadow: "0 0 12px rgba(212, 175, 55, 0.8)",
          zIndex: 10,
        }}
      />
    </div>
  )
}
