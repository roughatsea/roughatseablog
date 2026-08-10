import React, { useRef, useEffect, useState } from 'react';

export default function PhysicsDemo() {
  const canvasRef = useRef(null);
  const [gravity, setGravity] = useState(0.5);
  const [restitution, setRestitution] = useState(0.8);
  const [resetCount, setResetCount] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let ball = {
      x: canvas.width / 2,
      y: 50,
      radius: 20,
      vx: (Math.random() - 0.5) * 10, // Random initial horizontal velocity
      vy: 0
    };

    const animate = () => {
      // Clear canvas with a slight trail effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      // If dark mode, use dark trail
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
      }
      
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Physics
      ball.vy += gravity;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Floor collision
      if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.vy *= -restitution;
        
        // Add a bit of friction to horizontal velocity when it bounces
        ball.vx *= 0.99;
      }
      
      // Ceiling collision
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -restitution;
      }
      
      // Wall collisions
      if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -restitution;
      } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -restitution;
      }

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#3291ff';
      ctx.fill();
      ctx.closePath();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial clear
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#0a0a0a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [gravity, restitution, resetCount]);

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', margin: '2rem 0', backgroundColor: 'var(--surface-color)' }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', fontFamily: 'var(--font-sans)', fontSize: '1.25rem' }}>Interactive Bouncing Ball</h4>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Gravity</span>
            <span>{gravity.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            value={gravity} 
            onChange={(e) => setGravity(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'ew-resize' }}
          />
        </div>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Bounciness (Restitution)</span>
            <span>{restitution.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="1.2" 
            step="0.1" 
            value={restitution} 
            onChange={(e) => setRestitution(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'ew-resize' }}
          />
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={400} 
        style={{ 
          width: '100%', 
          height: 'auto', 
          backgroundColor: 'var(--bg-color)', 
          border: '1px solid var(--border-color)',
          borderRadius: '4px', 
          cursor: 'pointer',
          display: 'block'
        }}
        onClick={() => setResetCount(c => c + 1)}
      />
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>
        Click the canvas to spawn a new ball!
      </p>
    </div>
  );
}
