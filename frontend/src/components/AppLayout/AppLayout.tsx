import { Outlet } from 'react-router-dom'
import { BottomNav } from '../BottomNav/BottomNav'
import styles from './AppLayout.module.css'

/** Layout das telas principais: conteúdo rolável + navegação inferior fixa. */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
