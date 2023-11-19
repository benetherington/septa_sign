import {LitElement, html, css, choose} from '/lit-all.min.js';

import './components/route-selector.js';
import './components/stop-selector.js';

export default class SeptaConfiguration extends LitElement {
    static properties = {
        stage: {type: String, reflect: true},
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: row;
        }
    `;

    render() {
        return html`
            <route-selector @select=${this.setRoute}></route-selector>
            <stop-selector></stop-selector>
        `;
    }

    constructor() {
        super();

        this.stage = 'route';
    }

    setRoute() {
        this.stage = 'stop';

        const routeId =
            this.renderRoot.querySelector('route-selector').selectedRouteId;
        console.log(routeId);
        console.log(this.renderRoot.querySelector('route-selector'));
        this.renderRoot.querySelector('stop-selector').selectedRouteId =
            routeId;
    }
}
customElements.define('septa-configuration', SeptaConfiguration);
