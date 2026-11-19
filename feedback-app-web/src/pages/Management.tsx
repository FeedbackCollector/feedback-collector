import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ManagementComp from '../components/Management';
import type { ManagementTab } from '../types/managementTypes';

const TAB_BY_SLUG: Record<string, ManagementTab> = {
  areas: 'Areas',
  managers: 'Managers',
  ics: 'ICs',
  projects: 'Projects',
};

export default function Management() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab ? TAB_BY_SLUG[tab.toLowerCase()] : undefined;

  if (!activeTab) {
    return <Navigate to="/management/areas" replace />;
  }

  return (
    <ManagementComp
      activeTab={activeTab}
      onTabChange={(next) => navigate(`/management/${next.toLowerCase()}`)}
    />
  );
}
