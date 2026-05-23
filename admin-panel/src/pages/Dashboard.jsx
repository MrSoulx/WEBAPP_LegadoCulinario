import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { dashboardAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState({
    totalRecetas: 0,
    vistasMensuales: '0',
    topRecipe: 'N/A',
    feedbackTotal: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      const { chartData: rawData, totals } = response.data.data;

      setStats({
        totalRecetas: totals.recetas || 0,
        vistasMensuales: rawData.reduce((acc, curr) => acc + curr.vistas, 0).toLocaleString(),
        topRecipe: totals.topRecipe?.name || 'N/A',
        feedbackTotal: totals.feedbackTotal || 0
      });

      // Colores por Región (Solicitud Usuario)
      const regionColors = {
        'Costa': '#FFD700',   // Amarillo
        'Sierra': '#2196F3',  // Azul
        'Oriente': '#4CAF50', // Verde (Amazonía)
        'Insular': '#F44336'  // Rojo
      };

      const preparedData = {
        labels: rawData.map(item => item.recipeName || 'Sin nombre'),
        datasets: [
          {
            label: 'Vistas',
            data: rawData.map(item => item.vistas || 0),
            backgroundColor: rawData.map(item => regionColors[item.region] || '#9E9E9E'),
            borderRadius: 10,
            barThickness: 45,
          },
        ],
        regions: rawData.map(item => item.region)
      };

      setChartData(preparedData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#eee',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          afterLabel: (context) => `Región: ${chartData.regions[context.dataIndex]}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f0f0f0', drawBorder: false },
        ticks: { 
          callback: (value) => value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value,
          font: { size: 11 }
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: '600' } }
      }
    }
  };

  return (
    <Layout title="Panel del Administrador">
      <div className="dashboard-page" style={{ padding: '0px', background: '#f5f5f5', minHeight: '100vh' }}>
        
        {/* Tarjetas Superiores */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
          <div className="stat-card" style={statCardStyle}>
            <p style={labelStyle}>Total de recetas</p>
            <h2 style={valueStyle}>{stats.totalRecetas}</h2>
          </div>
          <div className="stat-card" style={statCardStyle}>
            <p style={labelStyle}>Vistas mensuales</p>
            <h2 style={valueStyle}>{stats.vistasMensuales}</h2>
          </div>
          <div className="stat-card" style={statCardStyle}>
            <p style={labelStyle}>Receta más vista</p>
            <h2 style={{ ...valueStyle, fontSize: '1.4rem', textTransform: 'lowercase' }}>{stats.topRecipe}</h2>
          </div>
          <div className="stat-card" style={statCardStyle}>
            <p style={labelStyle}>Comentarios</p>
            <h2 style={valueStyle}>{stats.feedbackTotal}</h2>
          </div>
        </div>

        {/* Gráfico de Vistas Real */}
        <div className="chart-section" style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '40px', 
          boxShadow: '0 2px 15px rgba(0,0,0,0.03)',
          marginBottom: '40px'
        }}>
          <h3 style={{ textAlign: 'center', marginBottom: '40px', fontWeight: '800', fontSize: '20px' }}>Gráfico de vistas</h3>
          
          <div className="chart-container-wrapper">
            <div className="chart-canvas-container">
              {!loading && chartData && <Bar data={chartData} options={options} />}
            </div>
            
            {/* Leyenda lateral (Actualizada Colores) */}
            <div className="chart-legend-container">
              <p style={{ fontSize: '12px', fontWeight: '800', marginBottom: '15px' }}>Región</p>
              <div style={legendItem}><span style={{ ...dot, background: '#FFD700' }}></span> Costa</div>
              <div style={legendItem}><span style={{ ...dot, background: '#2196F3' }}></span> Sierra</div>
              <div style={legendItem}><span style={{ ...dot, background: '#4CAF50' }}></span> Amazonía</div>
              <div style={legendItem}><span style={{ ...dot, background: '#F44336' }}></span> Insular</div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <button onClick={() => navigate('/recipes/new')} style={{ ...actionBtn, background: '#FF9800' }}>Nueva receta</button>
          <button onClick={() => navigate('/recipes')} style={{ ...actionBtn, background: '#2196F3' }}>Editar Receta</button>
          <button onClick={() => navigate('/recipes')} style={{ ...actionBtn, background: '#FF9800' }}>Todas las Recetas</button>
        </div>
      </div>
    </Layout>
  );
};

// Estilos
const statCardStyle = { background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };
const labelStyle = { color: '#888', fontSize: '13px', fontWeight: '600', marginBottom: '15px' };
const valueStyle = { margin: 0, fontSize: '2.8rem', fontWeight: '800', color: '#111' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '12px', fontWeight: '600' };
const dot = { width: '12px', height: '12px', borderRadius: '2px' };
const actionBtn = { 
  border: 'none', 
  color: 'white', 
  padding: '15px', 
  borderRadius: '8px', 
  fontSize: '16px', 
  fontWeight: '700', 
  cursor: 'pointer',
  transition: 'opacity 0.2s',
  width: '100%'
};

export default Dashboard;
