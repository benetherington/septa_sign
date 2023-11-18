import {LitElement, html, css} from '/lit-all.min.js';

import './components/route-selector.js';

export default class SeptaConfiguration extends LitElement {
    static properties = {
        stage: {type: String, reflect: true},
    };

    static styles = css``;

    render() {
        return html` <route-selector></route-selector> `;
    }

    constructor() {
        super();
    }
}
customElements.define('septa-configuration', SeptaConfiguration);
