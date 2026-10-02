import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import TaskView from './pages/TaskView'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<TaskView kind="inbox" />} />
        <Route path="/today" element={<TaskView kind="today" />} />
        <Route path="/upcoming" element={<TaskView kind="upcoming" />} />
        <Route path="/completed" element={<TaskView kind="completed" />} />
        <Route path="/project/:id" element={<TaskView kind="project" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>)
}
