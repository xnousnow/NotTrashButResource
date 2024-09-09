<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let imageEffect: HTMLCanvasElement
  let particles: { x: number; y: number; delay: number }[] = []
  let animationId: number

  const resizeCanvas = () => {
    imageEffect.width = window.innerWidth
    imageEffect.height = window.innerHeight
    initParticles()
  }

  const initParticles = () => {
    const particleCount = Math.floor(20000 / (window.devicePixelRatio || 1))
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * imageEffect.width,
      y: Math.random() * imageEffect.height,
      delay: Math.random() * 2
    }))
  }

  const startEffect = () => {
    resizeCanvas()
    const ctx = imageEffect.getContext('2d')!

    const drawParticles = () => {
      ctx.clearRect(0, 0, imageEffect.width, imageEffect.height)
      particles.forEach(({ x, y, delay }) => {
        const time = Date.now() / 1000 + delay
        const opacity = (Math.sin(time * Math.PI) + 1) / 2
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fillRect(x, y, 1, 1)
      })
      animationId = requestAnimationFrame(drawParticles)
    }
    drawParticles()
  }

  const stopEffect = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }

  onMount(() => {
    startEffect()
  })

  onDestroy(() => {
    stopEffect()
  })
</script>

<svelte:window on:resize={resizeCanvas} />
<canvas bind:this={imageEffect} class="absolute left-0 top-0 h-full w-full opacity-30" />
