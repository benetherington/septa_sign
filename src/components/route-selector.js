import {LitElement, html, css, until, map} from '/lit-all.min.js';

export default class RouteSelector extends LitElement {
    static properties = {
        selectedRouteId: {type: String, reflect: true},
    };

    static styles = css`
        :host {
            display: block;
            width: 25%;
            height: 90vh;
            overflow-y: scroll;
        }

        .list-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .route {
            cursor: pointer;
        }
        .route:hover {
            background-color: #cadeff80;
        }
        .route.selected {
            background-color: #cadeff;
        }
    `;

    render() {
        return html`
            <div class="list-container">
                ${until(this.routesContent(), this.loadingContent())}
            </div>
        `;
    }

    async routesContent() {
        const routes = await this.routes;
        return html`
            ${map(routes, ([id, name]) => {
                const selected = id === this.selectedRouteId;
                return html`
                    <div
                        class="route ${selected ? 'selected' : ''}"
                        data-id="${id}"
                        @click=${this.routeClick}>
                        ${name}
                    </div>
                `;
            })}
        `;
    }
    loadingContent() {
        return html`Loading routes...`;
    }

    constructor() {
        super();

        this.routes = this.getRoutes();
    }

    async getRoutes() {
        const url = '/septa/bus/routes';
        const resp = await fetch(url);
        return resp.json();
    }

    routeClick(event) {
        this.selectedRouteId = event.target.dataset.id;
        this.dispatchEvent(new Event('select'));
    }
}
customElements.define('route-selector', RouteSelector);
