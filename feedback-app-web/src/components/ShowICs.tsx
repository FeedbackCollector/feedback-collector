import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const managerId = useAuthStore((state) => state.user?.id);
  console.log("manager id:", managerId);

  useEffect(() => {
  if (!managerId) {
    setIcs([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  setIcs([]);

  fetch(`https://feedback-api-latest-moe8.onrender.com/ics?manager_id=${managerId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Could not load ICs');
      }

      return response.json();
    })
    .then((res) => {
      setIcs(res.data);
    })
    .catch((error) => {
      console.error('Error retrieving ICs:', error);
    })
    .finally(() => {
      setLoading(false);
    });
}, [managerId]);

   const getBadgeColor = (entries: number) => {
    switch (entries) {
      case 1: return '#d31c37';
      case 2: return '#e65100';
      case 3: return '#e07b00';
      case 4: return '#55a613';
      case 5: return '#1b7800';
      default: return '#1318a6';
    }
  };

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (ics.length === 0) {
    return (
      <div className="show-ics-empty">
        <i className="fa-solid fa-user-group"></i>
        <p>You don't have any Individual Contributors assigned yet. The Director assigns ICs to each manager.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Your Team</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {ics.map((item) => (
          <div 
            key={item.IC_id} 
            style={{ 
              display: 'flex', 
              border: '1px solid #ccc', 
              borderRadius: '12px', 
              padding: '20px', 
              minWidth: '280px',
              flex: '1',
              alignItems: 'center',
            }}
          >
            <div 
              style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%', 
                backgroundColor: '#ddd', 
                marginRight: '15px',
              }} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{item.title}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                <span 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: getBadgeColor(item.entries),
                    color: 'white', 
                    fontSize: '12px'
                  }}
                >
                  {item.entries}
                </span>
                <span style={{ fontSize: '14px', color: '#444' }}>{item.entries} entries</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ObtainICs;
