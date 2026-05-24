function Footer() {
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        padding: '14px 0',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: '#f8fafc',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        boxShadow: '0 -10px 30px rgba(15, 23, 42, 0.35)',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        zIndex: 999,
      }}
    >
      @2025-All-Rights.Reserved
    </footer>
  )
}

export default Footer
