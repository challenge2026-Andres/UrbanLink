import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout/AppLayout'
import { TrajetoProvider } from './flows/trajeto/TrajetoProvider'
import { CreditoEcoa } from './pages/CreditoEcoa/CreditoEcoa'
import { Home } from './pages/Home/Home'
import { MeuImpacto } from './pages/MeuImpacto/MeuImpacto'
import { NovoTrajeto } from './pages/NovoTrajeto/NovoTrajeto'
import { TrajetoValidado } from './pages/ValidarTrajeto/TrajetoValidado'
import { ValidarTrajetoFoto } from './pages/ValidarTrajeto/ValidarTrajetoFoto'
import { ValidarTrajetoProcessando } from './pages/ValidarTrajeto/ValidarTrajetoProcessando'
import { ValidarTrajetoRevisao } from './pages/ValidarTrajeto/ValidarTrajetoRevisao'

export function App() {
  return (
    <div className="app-shell">
      <TrajetoProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/impacto" element={<MeuImpacto />} />
            <Route path="/credito" element={<CreditoEcoa />} />
            <Route path="/novo-trajeto" element={<NovoTrajeto />} />
            <Route path="/validar/foto" element={<ValidarTrajetoFoto />} />
            <Route path="/validar/revisao" element={<ValidarTrajetoRevisao />} />
            <Route path="/validar/processando" element={<ValidarTrajetoProcessando />} />
          </Route>
          <Route path="/validar/resultado" element={<TrajetoValidado />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TrajetoProvider>
    </div>
  )
}
