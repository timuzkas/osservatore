import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  Play, Square, RotateCcw, Cloud, Terminal, Cpu, 
  Settings2, Plus, UploadCloud, X, 
  Box, Save, Trash2, Check,
  Globe, Database, Server, Zap, Shield, AlertTriangle,
  Github, Loader2
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ICONS = {
  cpu: Cpu, terminal: Terminal, box: Box, globe: Globe,
  database: Database, server: Server, zap: Zap, shield: Shield, cloud: Cloud
}

const COLORS = {
  blue: "bg-blue-950/30 text-blue-400 border-blue-900/50",
  emerald: "bg-emerald-950/30 text-emerald-400 border-emerald-900/50",
  violet: "bg-violet-950/30 text-violet-400 border-violet-900/50",
  orange: "bg-orange-950/30 text-orange-400 border-orange-900/50",
  rose: "bg-rose-950/30 text-rose-400 border-rose-900/50",
  slate: "bg-slate-900 text-slate-300 border-slate-800"
}

interface UpdateConfig {
  repo_url: string; branch: string; pre_update: string[]; post_update: string[]; build_command: string;
}

interface Service {
  id: string; name: string; type: 'systemd' | 'pm2' | 'podman' | 'docker';
  status: 'running' | 'stopped' | 'error' | 'updating' | 'unknown';
  description: string; path: string; icon: string; color: string; update_config: UpdateConfig;
}

export default function App() {
  const [services, setServices] = useState<Service[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deployingService, setDeployingService] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchServices = async () => {
    try {
      const res = await fetch('http://localhost:3014/api/services')
      const data = await res.json()
      setServices(data || [])
      setHasLoaded(true)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchServices()
    const interval = setInterval(fetchServices, 5000)
    document.documentElement.classList.add('dark')
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (id: string, type: string) => {
    if (type === 'update') {
      const service = services.find(s => s.id === id)
      if (service) setDeployingService(service)
      return
    }
    try {
      await fetch(`http://localhost:3014/api/services/${id}/action?type=${type}`, { method: 'POST' })
      fetchServices()
    } catch (err) { console.error(err) }
  }

  const saveService = async (service: Service) => {
    try {
      await fetch('http://localhost:3014/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      })
      setIsModalOpen(false)
      setEditingService(null)
      fetchServices()
    } catch (err) { console.error(err) }
  }

  const deleteService = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/services/${id}`, { method: 'DELETE' })
      setIsModalOpen(false)
      setEditingService(null)
      fetchServices()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen p-4 md:p-12 lg:p-16 max-w-7xl mx-auto flex flex-col bg-slate-950 text-slate-50 selection:bg-white selection:text-slate-950">
      <header className="mb-12 md:mb-20 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-9xl font-serif font-medium tracking-tighter text-slate-50"
          >
            Osservatore
          </motion.h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] md:text-xs font-medium tracking-wide">
            <span className="text-slate-500 uppercase tracking-[0.2em] font-black">by</span>
            <a href="https://timuzkas.xyz" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white transition-colors underline decoration-slate-800 underline-offset-4 decoration-2">timuzkas</a>
            <div className="h-4 w-px bg-slate-800" />
            <a href="https://github.com/timuzkas/osservatore" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
              <Github size={14} className="group-hover:scale-110 transition-transform" />
              <span className="underline decoration-slate-800 underline-offset-4 decoration-2">Github</span>
            </a>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-slate-500 italic lowercase">{services.length} services found</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingService({
                id: '', name: '', type: 'systemd', status: 'stopped', description: '', path: '', icon: 'cpu', color: 'blue',
                update_config: { repo_url: '', branch: 'main', pre_update: [], post_update: [], build_command: '' }
              })
              setIsModalOpen(true)
            }}
            className="bg-white text-slate-900 px-10 py-5 rounded-3xl flex items-center justify-center gap-3 font-black text-lg shadow-2xl"
          >
            <Plus size={24} strokeWidth={3} /> Create
          </motion.button>
        </div>
      </header>

      <LayoutGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          <AnimatePresence mode="popLayout" initial={false}>
            {services.map((service, idx) => (
              <ServiceCard 
                key={service.id} service={service} index={idx}
                hasLoaded={hasLoaded}
                onAction={handleAction}
                onEdit={() => {
                  setEditingService({...service})
                  setIsModalOpen(true)
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {isModalOpen && editingService && (
          <ServiceConfigModal 
            service={editingService}
            onClose={() => { setIsModalOpen(false); setEditingService(null); }}
            onSave={saveService}
            onDelete={deleteService}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deployingService && (
          <DeploymentConsole 
            service={deployingService}
            onClose={() => setDeployingService(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DeploymentConsole({ service, onClose }: { service: Service, onClose: () => void }) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<'running' | 'success' | 'failed'>('running')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:3014/api/ws/deploy/${service.id}`)
    
    ws.onmessage = (event) => {
      const msg = event.data
      setLogs(prev => [...prev, msg])
      if (msg.includes('Deployment Successful')) setStatus('success')
      if (msg.includes('Deployment Failed')) setStatus('failed')
    }

    ws.onclose = () => {
      if (status === 'running') setStatus('failed')
    }

    return () => ws.close()
  }, [service.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={status !== 'running' ? onClose : undefined}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900 border border-slate-800 w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl",
              status === 'running' ? "bg-blue-500/10 text-blue-400" :
              status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
              "bg-red-500/10 text-red-400"
            )}>
              {status === 'running' ? <Loader2 size={24} className="animate-spin" /> :
               status === 'success' ? <Check size={24} /> : <X size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-serif font-semibold text-slate-50">Deploying {service.name}</h2>
              <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">
                {status === 'running' ? 'Active Pipeline Running' : 'Pipeline Finished'}
              </p>
            </div>
          </div>
          {status !== 'running' && (
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-xl transition-all">
              <X size={24} className="text-slate-400" />
            </button>
          )}
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 font-mono text-sm leading-relaxed space-y-1"
        >
          {logs.map((log, i) => (
            <div key={i} className={cn(
              "flex gap-4",
              log.startsWith('▸') || log.startsWith('Starting') || log.startsWith('Executing') ? "text-blue-400 font-bold mt-4" :
              log.includes('Successful') ? "text-emerald-400 font-black text-lg py-4 border-t border-slate-800" :
              log.includes('Failed') ? "text-red-400 font-black text-lg py-4 border-t border-slate-800" :
              "text-slate-400"
            )}>
              <span className="text-slate-700 select-none">{String(i + 1).padStart(3, '0')}</span>
              <span className="whitespace-pre-wrap">{log}</span>
            </div>
          ))}
          {status === 'running' && (
            <div className="flex gap-4 text-blue-400/50 animate-pulse">
              <span className="text-slate-700 select-none">...</span>
              <span>Awaiting output</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center px-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Osservatore Runtime Engine v1.0</span>
          {status !== 'running' && (
            <button onClick={onClose} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Close Console</button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ServiceConfigModal({ service, onClose, onSave, onDelete }: { service: Service, onClose: () => void, onSave: (s: Service) => void, onDelete: (id: string) => void }) {
  const [data, setData] = useState<Service>(service)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditing = service.id !== ''

  const updateStep = (key: 'pre_update' | 'post_update', idx: number, val: string) => {
    const next = [...data.update_config[key]]
    next[idx] = val
    setData({ ...data, update_config: { ...data.update_config, [key]: next } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative bg-slate-900 rounded-t-[3rem] md:rounded-[4rem] shadow-3xl w-full max-w-5xl h-[92vh] md:h-full md:max-h-[90vh] overflow-hidden flex flex-col border-t md:border border-slate-800"
      >
        <div className="p-8 md:p-12 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-slate-900/90 backdrop-blur-2xl">
          <h2 className="text-3xl md:text-5xl font-serif font-semibold text-slate-50">Configuration</h2>
          <button onClick={onClose} className="p-4 hover:bg-slate-800 rounded-2xl transition-all"><X size={32} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 pb-40">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Icon Selection</h3>
            <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
              {Object.entries(ICONS).map(([name, Icon]) => (
                <button 
                  key={name} onClick={() => setData({...data, icon: name})}
                  className={cn(
                    "aspect-square rounded-2xl border-2 transition-all flex justify-center items-center",
                    data.icon === name ? "border-slate-50 bg-slate-50 text-slate-900" : "border-slate-800 bg-slate-950 text-slate-500"
                  )}
                ><Icon size={20} /></button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <InputField label="Identifier" value={data.id} onChange={v => setData({...data, id: v})} disabled={isEditing} />
              <InputField label="Display Name" value={data.name} onChange={v => setData({...data, name: v})} />
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                <select value={data.type} onChange={e => setData({...data, type: e.target.value as any})} className="input-field bg-slate-950">
                  <option value="systemd">Systemd</option><option value="pm2">PM2</option><option value="podman">Podman</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <InputField label="Working Directory" value={data.path} onChange={v => setData({...data, path: v})} />
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} className="input-field h-32 md:h-40 resize-none py-4 bg-slate-950" />
              </div>
            </div>
          </section>

          <section className="space-y-8 bg-slate-950/50 p-8 md:p-12 rounded-[3rem] border border-slate-800">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Automation Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Repo URL" value={data.update_config.repo_url} onChange={v => setData({...data, update_config: {...data.update_config, repo_url: v}})} />
              <InputField label="Branch" value={data.update_config.branch} onChange={v => setData({...data, update_config: {...data.update_config, branch: v}})} />
            </div>
            <InputField label="Build Script" value={data.update_config.build_command} onChange={v => setData({...data, update_config: {...data.update_config, build_command: v}})} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center"><label className="text-xs font-black text-slate-500 uppercase">Pre-Update</label><button onClick={() => setData({...data, update_config: {...data.update_config, pre_update: [...data.update_config.pre_update, '']}})} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Add Step</button></div>
                {data.update_config.pre_update.map((cmd, i) => <input key={i} value={cmd} onChange={e => updateStep('pre_update', i, e.target.value)} className="input-field py-4 text-sm bg-slate-900 border-slate-800" />)}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><label className="text-xs font-black text-slate-500 uppercase">Post-Update</label><button onClick={() => setData({...data, update_config: {...data.update_config, post_update: [...data.update_config.post_update, '']}})} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Add Step</button></div>
                {data.update_config.post_update.map((cmd, i) => <input key={i} value={cmd} onChange={e => updateStep('post_update', i, e.target.value)} className="input-field py-4 text-sm bg-slate-900 border-slate-800" />)}
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 md:p-12 border-t border-slate-800 bg-slate-900/95 backdrop-blur-2xl flex gap-4 md:gap-6 sticky bottom-0">
          <button onClick={() => onSave(data)} className="flex-1 bg-slate-50 text-slate-900 py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl">
            <Save size={28} /> Save Changes
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!isEditing}
              className="h-full px-10 bg-red-950/20 text-red-600 rounded-[2rem] flex items-center justify-center hover:bg-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={28} />
            </button>

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full right-0 mb-4 w-72 bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-3xl z-20"
                >
                  <div className="flex flex-col gap-4 text-center">
                    <div className="mx-auto p-3 bg-red-900/20 rounded-full text-red-500">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-50">Delete Service?</h4>
                      <p className="text-xs text-slate-400 mt-1">This action cannot be undone and will remove all orchestration logic.</p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => onDelete(data.id)}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-xl font-bold text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-full right-10 -mt-px w-4 h-4 bg-slate-800 border-r border-b border-slate-700 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder = "", disabled = false }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">{label}</label>
      <input 
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={cn("input-field py-5 bg-slate-950 text-slate-50", disabled && "opacity-50 cursor-not-allowed")}
        placeholder={placeholder} 
      />
    </div>
  )
}

function ServiceCard({ service, index, hasLoaded, onAction, onEdit }: { service: Service, index: number, hasLoaded: boolean, onAction: (id: string, type: string) => void, onEdit: () => void }) {
  const isRunning = service.status === 'running'
  const IconComponent = ICONS[service.icon as keyof typeof ICONS] || Cpu
  const colorClass = COLORS[service.color as keyof typeof COLORS] || COLORS.blue

  return (
    <motion.div
      layout
      initial={hasLoaded ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 25,
        delay: hasLoaded ? 0 : index * 0.05 
      }}
      className="bg-slate-900 rounded-[3rem] p-8 md:p-10 flex flex-col justify-between group border border-slate-800 shadow-2xl hover:border-slate-700 transition-all duration-500"
    >
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className={cn("p-5 rounded-3xl transition-all duration-700 group-hover:scale-110 border-2", colorClass)}>
            <IconComponent size={32} />
          </div>
          <div className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
            isRunning ? "bg-emerald-900/40 text-emerald-400" : "bg-slate-800 text-slate-400"
          )}>{service.status}</div>
        </div>
        <h3 className="text-4xl font-serif font-semibold text-slate-50 mb-3 tracking-tighter transition-colors duration-500">{service.name}</h3>
        <p className="text-slate-400 text-lg mb-10 line-clamp-2 font-medium leading-relaxed opacity-80">{service.description}</p>
      </div>
      <div className="flex gap-3">
        {!isRunning ? (
          <ActionButton onClick={() => onAction(service.id, 'start')} icon={<Play size={24} fill="currentColor" />} label="Start Service" variant="primary" />
        ) : (
          <ActionButton onClick={() => onAction(service.id, 'stop')} icon={<Square size={24} fill="currentColor" />} label="Stop Service" variant="secondary" />
        )}
        <ActionButton onClick={() => onAction(service.id, 'restart')} icon={<RotateCcw size={24} />} label="Restart Service" />
        <ActionButton onClick={() => onAction(service.id, 'update')} icon={<UploadCloud size={24} />} label="Update and Deploy" />
        <ActionButton onClick={onEdit} icon={<Settings2 size={24} />} label="Configure" />
      </div>
    </motion.div>
  )
}

function ActionButton({ icon, onClick, label, variant = 'ghost' }: { icon: React.ReactNode, onClick?: () => void, label?: string, variant?: 'primary' | 'secondary' | 'ghost' }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex-1 relative">
      <motion.button
        whileHover={{ y: -4, scale: 1.05 }} 
        whileTap={{ scale: 0.9 }} 
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-full p-5 rounded-[1.5rem] flex justify-center items-center transition-all duration-300 shadow-sm",
          variant === 'primary' ? "bg-slate-50 text-slate-900 shadow-xl" :
          variant === 'secondary' ? "bg-red-950/20 text-red-600" :
          "bg-slate-800 text-slate-300 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="transition-transform group-hover:scale-110">{icon}</div>
      </motion.button>

      <AnimatePresence>
        {isHovered && label && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
