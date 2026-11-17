import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ManagerView from '../components/ManagerView';
import LoadingOverlay from '../components/LoadingOverlay';
import { obtainManagerById, type ManagerInfo } from '../service/ManagerFeedbackApi';
import { obtainAreas } from '../service/ObtainAreas';
import { useToastStore } from '../store/toastStore';

export default function ManagerTimeline() {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [areaName, setAreaName] = useState<string | undefined>();

  useEffect(() => {
    let isCurrent = true;
    setManager(null);

    obtainManagerById(Number(managerId))
      .then(async (data) => {
        const areas = await obtainAreas().catch(() => []);
        if (!isCurrent) return;
        setAreaName(areas.find((area) => area.id === data.area_id)?.name);
        setManager(data);
      })
      .catch((error) => {
        if (!isCurrent) return;
        console.error('Error retrieving manager:', error);
        useToastStore.getState().addToast('Could not load this manager.', 'error');
        navigate('/my-management', { replace: true });
      });

    return () => {
      isCurrent = false;
    };
  }, [managerId]);

  function goBack() {
    if (location.key === 'default') navigate('/my-management');
    else navigate(-1);
  }

  if (!manager) {
    return <LoadingOverlay message="Loading manager..." />;
  }

  return <ManagerView manager={manager} areaName={areaName} onBack={goBack} />;
}
