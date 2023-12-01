import {LitElement, html, css, until, repeat, guard} from '/lit-all.min.js';

import '/components/bold-button.js';

export default class RouteSelector extends LitElement {
    static properties = {
        routeId: {type: String, reflect: true},
        stopId: {type: String, reflect: true},
        columns: {type: Boolean, reflect: true},
    };

    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: row;
            overflow-y: auto;
        }

        /* ---------- *\
           ROUTE LIST
        \* ---------- */
        .list-container {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }
        :host([columns]) .list-container {
            max-width: 50%;
        }

        .route .name,
        .stop {
            cursor: pointer;

            overflow: hidden;

            padding: 5px 10px;
            text-wrap: nowrap;
            text-overflow: ellipsis;
        }

        .route:hover,
        .stop:hover {
            background-color: #cadeff80;
        }

        .route.selected,
        .route.selected .name,
        .stop.selected {
            background-color: #cadeff;
        }

        .route.selected .name {
            position: sticky;
            top: 0;
        }

        /* ------------- *\
           STOP SELECTOR
        \* ------------- */

        .stop-selector {
            height: 100%;
            display: block;
            overflow-y: auto;

            display: flex;
            flex-direction: column;
        }
        :host([columns]) .stop-selector {
            height: 100%;
        }

        .route .stop-selector {
            /* Style for inline display */
            height: auto;

            margin: 10px;
            padding: 10px;

            border: 2px solid black;
            border-radius: 4px;
            background-color: white;
        }

        /* -------------- *\
           CONFIRM BUTTON
        \* -------------- */
        bold-button {
            display: none;
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: calc(100% - 40px);
        }
        :host([routeid][stopid]) bold-button {
            display: revert;
        }

        /* ------------- *\
           LOADING MODAL
        \* ------------- */
        .loading-modal {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;

            display: flex;
            justify-content: center;
            align-items: center;

            background-color: #00000080;
            color: white;
            font-weight: 800;
        }
        .loading-modal.hide {
            display: none;
        }

        /* Loading message */
        .loading-modal p {
            text-align: center;
        }
        .loading-modal.fuck .load-message {
            display: none;
        }

        /* Fucked it message */
        .whoops-message {
            display: none;
        }
        .loading-modal.fuck .whoops-message {
            display: revert;
        }
        .whoops-message p:nth-child(2) {
            margin: 0;
            font-size: 3rem;
        }
    `;

    render() {
        return html`
            <div class="list-container">
                ${until(this.routesContent(), html`Loading routes...`)}
            </div>

            ${this.columns ? this.stopSelector() : null}

            <bold-button @click=${this.confirm}>
                Add ${this.stopName}
            </bold-button>

            <div class="loading-modal hide">
                <p class="load-message">One moment...</p>
                <div class="whoops-message">
                    <p>Something went wrong</p>
                    <p>🤷</p>
                </div>
            </div>
        `;
    }

    async routesContent() {
        const routes = await this.routes;
        return html`
            ${repeat(
                routes,
                (route) => route[0],
                ([id, name]) => {
                    const selected = id === this.routeId;
                    return html`
                        <div
                            class="route ${selected ? 'selected' : null}"
                            data-id="${id}">
                            <div class="name" @click=${this.routeClick}>
                                ${name}
                            </div>
                            ${selected && !this.columns
                                ? this.stopSelector()
                                : null}
                        </div>
                    `;
                },
            )}
        `;
    }

    stopSelector() {
        return this.routeId
            ? until(this.stopsContent(), html`Loading stops...`)
            : html`Select a route`;
    }
    async stopsContent() {
        if (!this.stops) this.stops = await this.getStops();
        return html`
            <div class="stop-selector">
                ${repeat(
                    this.stops,
                    ({stopid}) => stopid,
                    ({stopname, stopid}) => {
                        const selected = stopid === this.stopId;
                        return html`
                            <div
                                class="stop ${selected ? 'selected' : ''}"
                                data-id="${stopid}"
                                @click=${this.stopClick}>
                                ${stopname}
                            </div>
                        `;
                    },
                )}
            </div>
        `;
    }

    /*--------*\
      LIFECYLE
    \*--------*/
    constructor() {
        super();

        this.routes = this.getRoutes();

        this.columns = true;
        this.observer = new ResizeObserver(this.onResize);
    }

    connectedCallback() {
        super.connectedCallback();
        this.observer.observe(this);
    }

    disconnectedCallback() {
        super.connectedCallback();
        this.observer.disconnect();
    }

    /*---------*\
      UTILITIES
    \*---------*/
    async getRoutes() {
        const url = '/septa/bus/routes';
        const resp = await fetch(url);
        return resp.json();
    }
    async getStops() {
        const url = `/septa/bus/route/${this.routeId}`;
        const resp = await fetch(url);
        return resp.json();
    }
    async addStop() {
        const url = '/config/stop';
        const method = 'POST';
        const body = `${this.routeId}/${this.stopId}`;

        const resp = await fetch(url, {method, body});
        if (!resp.ok) {
            console.error(resp.statusText);
            return false;
        }

        return true;
    }

    /*--------------*\
      EVENT HANDLERS
    \*--------------*/
    onResize = ([entry]) => {
        // Update display mode
        const width = entry.borderBoxSize[0].inlineSize;
        const columns = width > 600;
        this.columns = columns;
    };

    routeClick = (event) => {
        const route = event.target.closest('.route');
        const selected = route.classList.contains('selected');

        if (selected) {
            this.routeId = null;
        } else {
            this.routeId = route.dataset.id;
            this.routeName = route.innerText;
        }
    };

    stopClick = (event) => {
        this.stopId = event.target.dataset.id;
        this.stopName = event.target.innerText;
    };

    confirm = async () => {
        // Show loading modal
        const loading = this.renderRoot.querySelector('.loading-modal');
        loading.classList.remove('hide');

        // Send request
        const success = await this.addStop();

        // Update modal
        if (success) {
            loading.classList.add('hide');
            this.dispatchEvent(new Event('select'));
        } else {
            loading.classList.add('fuck');
        }

        this.routeId = null;
        this.stopId = null;
    };
}
customElements.define('route-selector', RouteSelector);
