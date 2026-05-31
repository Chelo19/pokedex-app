import { useState } from 'react'
import { ModuleNav, type AppModule } from './components/ModuleNav'
import { AdminModule } from './features/admin/AdminModule'
import { DexModule } from './features/dex/DexModule'
import { TcgModule } from './features/tcg/TcgModule'

function App() {
  const [module, setModule] = useState<AppModule>('dex')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <ModuleNav active={module} onChange={setModule} />
      <div className="min-h-screen">
        {module === 'dex' && <DexModule />}
        {module === 'tcg' && <TcgModule />}
        {module === 'admin' && <AdminModule />}
      </div>
    </div>
  )
}

export default App
