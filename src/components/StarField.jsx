import { useEffect, useRef } from 'react'

// Классический "пролёт сквозь звёзды": каждая звезда летит от центра
// экрана к зрителю (z уменьшается), проекция на 2D-плоскость растёт по
// мере приближения. Когда звезда "долетает" — она возвращается в
// глубину со случайной позицией. Скорость намеренно низкая, чтобы
// эффект читался как медленный полёт, а не как гиперпрыжок.
const STAR_COUNT = 220
const SPEED = 0.35

export default function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let animationId = null

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function makeStar() {
      return {
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * width,
        o: Math.random() * 0.5 + 0.5,
      }
    }

    resize()
    let stars = Array.from({ length: STAR_COUNT }, makeStar)

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height / 2

      for (const star of stars) {
        star.z -= SPEED
        if (star.z <= 1) {
          Object.assign(star, makeStar())
          star.z = width
        }

        const k = 180 / star.z
        const sx = star.x * k + cx
        const sy = star.y * k + cy

        if (sx < 0 || sx > width || sy < 0 || sy > height) continue

        const size = Math.max(0.4, (1 - star.z / width) * 2.2)
        const alpha = star.o * (1 - star.z / width)

        ctx.beginPath()
        ctx.fillStyle = `rgba(210, 235, 255, ${Math.max(alpha, 0)})`
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    if (prefersReducedMotion) {
      // Статичное поле звёзд без анимации — уважаем настройку ОС
      draw()
      cancelAnimationFrame(animationId)
    } else {
      draw()
    }

    function handleResize() {
      resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="bg-stars" />
}
