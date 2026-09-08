import BottomTabBar from '../components/BottomTabBar';

export default function Profil() {
  return (
    <div className="app-shell">
      <div style={{ padding: '16px 16px 0', fontSize: 15, fontWeight: 800 }}>Profil</div>
      <p className="empty-state">Halaman profil — belum dibangun (P1).</p>
      <BottomTabBar active="/profil" />
    </div>
  );
}
