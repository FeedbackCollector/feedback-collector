import { useState, useEffect } from 'react';


type IC = {
  IC_id: number;
  name: string;
};


function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://feedback-api-latest-moe8.onrender.com/ics')                    // COLOCAR ENDPOINT
      .then((response) => response.json())
      .then((res) => {
        setIcs(Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
        console.log("Retrieved data:", res);
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
        setLoading(false);
      });
  }, []);

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
      <ul>
        {ics.map((item) => (
          <li key={item.IC_id}> {item.name}</li>
        ))}
      </ul>
  );
}

export default ObtainICs;
