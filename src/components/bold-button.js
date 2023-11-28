import {LitElement, html, css} from '/lit-all.min.js';

export default class BoldButton extends LitElement {
    static properties = {
        color: {type: String},
        text: {type: String},
    };

    static styles = css`
        :host {
            cursor: pointer;

            padding: 10px;
            border: 4px solid darkgreen;
            border-radius: 10px;
            background-color: green;
            color: white;

            text-align: center;
            font-weight: 600;
        }
    `;

    render() {
        return html`<slot></slot>`;
    }

    constructor() {
        super();
    }
}
customElements.define('bold-button', BoldButton);
