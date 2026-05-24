import viteLogo from '../assets/vite.svg'

function Header() {
  return (
    <header style={{ textAlign: 'center', margin: '32px 0' }}>
      <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', marginBottom: '20px' }}>
        hello vite
      </h1>
      <img src={viteLogo} alt="Vite logo" style={{ width: '160px', height: 'auto' }} />
    </header>
  )
}

export default Header
