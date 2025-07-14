// Dados das camadas corrigidos com URLs adequadas
const layersCatalog = [
    {
        id: 'limite',
        name: 'Limite Municipal',
        url: './data/limite_ibge.geojson',
        color: '#1d4ed8',
        type: 'vector'
    },
    {
        id: 'bairros',
        name: 'Bairros',
        url: './data/bairros_ibge.geojson',
        color: '#d97706',
        type: 'vector'
    },
    {
        id: 'logradouros',
        name: 'Faces de Logradouro 2022',
        url: './data/logradouros_ibge.geojson',
        color: '#16a34a',
        type: 'vector'
    },
    {
        id: 'municipios',
        name: 'Municípios',
        url: './data/municipios_ibge.geojson',
        color: '#dc2626',
        type: 'vector'
    },
    {
        id: 'uf',
        name: 'Unidades Federativas',
        url: './data/uf_ibge.geojson',
        color: '#7c3aed',
        type: 'vector'
    },
    {
        id: 'relevo',
        name: 'Padrão de Relevo',
        url: './data/relevo_ibge.geojson',
        color: '#059669',
        type: 'vector'
    }
];

function mapApp() {
    return {
        layers: layersCatalog,
        layerInstances: {},
        map: null,
        loading: false,

        init() {
            // Inicializar o mapa
            this.map = L.map('map').setView([-22.96574, -42.02799], 13);

            // Adicionar camada base
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            // Adicionar controles
            L.control.scale({
                position: 'bottomright',
                imperial: false
            }).addTo(this.map);

            // Aguardar um pouco para garantir que o mapa foi inicializado
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        },

        async toggleLayer(layer) {
            // Se a camada já existe, remove ela
            if (this.layerInstances[layer.id]) {
                this.map.removeLayer(this.layerInstances[layer.id]);
                delete this.layerInstances[layer.id];
                console.log(`Camada ${layer.name} removida`);
                return;
            }

            // Se é uma camada vetorial, carrega ela
            if (layer.type === 'vector') {
                this.loading = true;
                console.log(`Tentando carregar: ${layer.url}`);

                try {
                    const response = await fetch(layer.url);
                    console.log(`Status da resposta: ${response.status}`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const contentType = response.headers.get('content-type');
                    console.log(`Content-Type: ${contentType}`);

                    const data = await response.json();
                    console.log(`Dados carregados:`, data);

                    // Verificar se é um GeoJSON válido
                    if (!data.type || !data.features) {
                        throw new Error('Arquivo não é um GeoJSON válido');
                    }

                    const geoLayer = L.geoJSON(data, {
                        style: {
                            color: layer.color,
                            weight: 2,
                            opacity: 0.8,
                            fillOpacity: 0.3
                        },
                        onEachFeature: (feature, layer) => {
                            if (feature.properties) {
                                const properties = Object.entries(feature.properties)
                                    .filter(([key, value]) => value !== null && value !== '')
                                    .map(([key, value]) =>
                                        `<tr><td class="pr-2 font-medium text-gray-700">${key}:</td><td class="text-gray-900">${value}</td></tr>`
                                    )
                                    .join('');

                                const popupContent = `
                                    <div class="p-2">
                                        <h4 class="font-semibold text-gray-800 mb-2">${layer.name || 'Informações'}</h4>
                                        <table class="text-xs w-full">
                                            ${properties}
                                        </table>
                                    </div>
                                `;

                                layer.bindPopup(popupContent, {
                                    maxWidth: 300,
                                    className: 'custom-popup'
                                });
                            }
                        }
                    });

                    geoLayer.addTo(this.map);
                    this.layerInstances[layer.id] = geoLayer;
                    console.log(`Camada ${layer.name} carregada com sucesso`);

                    // Ajustar zoom para mostrar a camada se é a primeira
                    if (Object.keys(this.layerInstances).length === 1) {
                        this.map.fitBounds(geoLayer.getBounds());
                    }

                } catch (error) {
                    console.error('Erro detalhado:', error);
                    console.error('URL que falhou:', layer.url);

                    // Verificar se o arquivo existe
                    try {
                        const testResponse = await fetch(layer.url, { method: 'HEAD' });
                        console.log(`Arquivo existe? Status: ${testResponse.status}`);
                    } catch (testError) {
                        console.error('Erro ao verificar existência do arquivo:', testError);
                    }

                    alert(`Erro ao carregar "${layer.name}": ${error.message}\n\nVerifique o console para mais detalhes.`);
                } finally {
                    this.loading = false;
                }
            }
        },

        // Método para verificar se uma camada está ativa
        isLayerActive(layerId) {
            return this.layerInstances[layerId] !== undefined;
        },

        // Método para limpar todas as camadas
        clearAllLayers() {
            Object.keys(this.layerInstances).forEach(layerId => {
                this.map.removeLayer(this.layerInstances[layerId]);
                delete this.layerInstances[layerId];
            });
        }
    };
}
