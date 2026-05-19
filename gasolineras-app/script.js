const { createApp } = Vue;

createApp({

    data() {
        return {

            latitude: 40.4168,

            longitude: -3.7038,

            radius: 5,

            selectedFuel: '',

            brandFilter: '',

            brands: [],

            allStations: [],

            gasStations: [],

            loading: false,

            error: '',

            searched: false
        };
    },

    methods: {

        async searchGasStations() {

            this.loading = true;

            this.error = '';

            this.searched = true;

            this.gasStations = [];

            try {

                const apiUrl =
                    'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

                const response =
                    await fetch(apiUrl);

                if (!response.ok) {

                    throw new Error(
                        `Error HTTP: ${response.status}`
                    );
                }

                const data =
                    await response.json();

                this.allStations =
                    this.processGasStations(data);

                this.loadBrandsFromStations(
                    this.allStations
                );

                this.applyFilters();

            } catch (err) {

                console.error(
                    'Error conectando con la API:',
                    err
                );

                this.error =
                    'No se pudo conectar con la API.';

            } finally {

                this.loading = false;
            }
        },

        processGasStations(data) {

            let stations = [];

            if (
                data &&
                data.ListaEESSPrecio &&
                Array.isArray(
                    data.ListaEESSPrecio
                )
            ) {

                stations =
                    data.ListaEESSPrecio
                    .map(station => {

                        const lat =
                            this.convertNumber(
                                station['Latitud']
                            );

                        const lon =
                            this.convertNumber(
                                station['Longitud (WGS84)']
                            );

                        if (
                            isNaN(lat) ||
                            isNaN(lon)
                        ) {
                            return null;
                        }

                        const distance =
                            this.calculateDistance(
                                Number(this.latitude),
                                Number(this.longitude),
                                lat,
                                lon
                            );

                        return {

                            nombre:
                                station['Rótulo']
                                || 'Sin nombre',

                            empresa:
                                station['Rótulo']
                                || 'Desconocida',

                            direccion:
                                station['Dirección']
                                || 'Sin dirección',

                            municipio:
                                station['Municipio']
                                || '',

                            provincia:
                                station['Provincia']
                                || '',

                            horario:
                                station['Horario']
                                || 'No especificado',

                            latitud: lat,

                            longitud: lon,

                            distancia: distance,

                            gasolina95:
                                station[
                                    'Precio Gasolina 95 E5'
                                ] || null,

                            gasolina98:
                                station[
                                    'Precio Gasolina 98 E5'
                                ] || null,

                            diesel:
                                station[
                                    'Precio Gasoleo A'
                                ] || null,

                            dieselPremium:
                                station[
                                    'Precio Gasoleo Premium'
                                ] || null
                        };

                    })
                    .filter(
                        station =>
                            station !== null
                    );
            }

            stations =
                stations.filter(
                    station =>
                        station.distancia <=
                        Number(this.radius)
                );

            stations =
                stations.sort(
                    (a, b) =>
                        a.distancia - b.distancia
                );

            return stations;
        },

        loadBrandsFromStations(stations) {

            const brandsSet = new Set();

            stations.forEach(station => {

                if (station.empresa) {

                    brandsSet.add(
                        station.empresa
                    );
                }
            });

            this.brands =
                Array.from(brandsSet)
                .sort();
        },

        applyFilters() {

            let filtered =
                [...this.allStations];

            if (this.selectedFuel) {

                filtered =
                    filtered.filter(station => {

                        if (
                            this.selectedFuel
                            === 'Gasolina 95'
                        ) {
                            return station.gasolina95;
                        }

                        if (
                            this.selectedFuel
                            === 'Gasolina 98'
                        ) {
                            return station.gasolina98;
                        }

                        if (
                            this.selectedFuel
                            === 'Diésel'
                        ) {
                            return station.diesel;
                        }

                        if (
                            this.selectedFuel
                            === 'Diésel+'
                        ) {
                            return station.dieselPremium;
                        }

                        return true;
                    });
            }

            if (this.brandFilter) {

                filtered =
                    filtered.filter(station =>

                        station.empresa ===
                        this.brandFilter
                    );
            }

            this.gasStations = filtered;
        },

        convertNumber(value) {

            if (!value) {
                return NaN;
            }

            return parseFloat(
                value.replace(',', '.')
            );
        },

        calculateDistance(
            lat1,
            lon1,
            lat2,
            lon2
        ) {

            const R = 6371;

            const dLat =
                this.degToRad(lat2 - lat1);

            const dLon =
                this.degToRad(lon2 - lon1);

            const a =

                Math.sin(dLat / 2) *

                Math.sin(dLat / 2) +

                Math.cos(
                    this.degToRad(lat1)
                ) *

                Math.cos(
                    this.degToRad(lat2)
                ) *

                Math.sin(dLon / 2) *

                Math.sin(dLon / 2);

            const c =
                2 * Math.atan2(
                    Math.sqrt(a),
                    Math.sqrt(1 - a)
                );

            return R * c;
        },

        degToRad(deg) {

            return deg * (Math.PI / 180);
        },

        getLocation() {

            if (!navigator.geolocation) {

                this.error =
                    'Geolocalización no disponible en tu navegador.';

                return;
            }

            this.loading = true;

            navigator.geolocation.getCurrentPosition(

                position => {

                    this.latitude =
                        position.coords.latitude;

                    this.longitude =
                        position.coords.longitude;

                    this.loading = false;

                    this.searchGasStations();
                },

                error => {

                    this.error =
                        'No se pudo obtener ubicación: '
                        + error.message;

                    this.loading = false;
                }
            );
        }
    }

}).mount('#app');