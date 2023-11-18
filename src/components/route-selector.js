import {LitElement, html, css, until, map} from '/lit-all.min.js';

export default class RouteSelector extends LitElement {
    static properties = {};

    static styles = css``;

    render() {
        return html`
            <div class="list-container">
                ${until(this.routesContent(), this.loadingContent())}
            </div>
        `;
    }

    async routesContent() {
        const routes = await this.getRoutes();
        return html`
            ${map(routes, ([id, name]) => {
                return html` <div class="route">${id}: ${name}</div> `;
            })}
        `;
    }
    loadingContent() {
        return html`Loading routes...`;
    }

    constructor() {
        super();
    }

    async getRoutes() {
        const url = '/septa/bus/routes';
        const resp = await fetch(url);
        return resp.json();
    }
}
customElements.define('route-selector', RouteSelector);
