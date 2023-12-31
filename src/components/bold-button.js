import {LitElement, html, css} from '/lit-all.min.js';

export default class BoldButton extends LitElement {
    static properties = {
        color: {type: String},
        borderColor: {type: String},
        text: {type: String},

        slim: {type: Boolean},
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
            font-size: var(--font-size);
        }

        :host([slim]) {
            padding: 3px 5px;
            border-width: 2px;
        }
    `;

    render() {
        return html`<slot></slot>`;
    }

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.color) this.style.setProperty('background-color', this.color);
        if (this.borderColor)
            this.style.setProperty('border-color', this.borderColor);
        if (this.text) this.style.setProperty('color', this.text);
    }
}
customElements.define('bold-button', BoldButton);
