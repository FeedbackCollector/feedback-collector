import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ICView from '../components/IcView';
import LoadingOverlay from '../components/LoadingOverlay';
import { obtainICById } from '../service/ObtainICs';
import { useToastStore } from '../store/toastStore';
import type { IC } from '../types/feedback';

export default function ICTimeline() {
  const { icId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [ic, setIc] = useState<IC | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIc(null);

    obtainICById(Number(icId))
      .then((data) => {
        if (isCurrent) setIc(data);
      })
      .catch((error) => {
        if (!isCurrent) return;
        console.error('Error retrieving IC:', error);
        useToastStore.getState().addToast('Could not load this IC.', 'error');
        navigate('/my-ics', { replace: true });
      });

    return () => {
      isCurrent = false;
    };
  }, [icId]);

  function goBack() {
    if (location.key === 'default') navigate('/my-ics');
    else navigate(-1);
  }

  if (!ic) {
    return <LoadingOverlay message="Loading IC..." />;
  }

  return <ICView ic={ic} onBack={goBack} />;
}
