import {LitElement, html, css, map, until} from '/lit-all.min.js';

import './components/route-selector.js';
import './components/icon-button.js';
import './components/bold-button.js';

export default class SeptaConfiguration extends LitElement {
    static properties = {
        mode: {type: String, reflect: true},
    };

    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;

            height: 50vh;
            width: 50vw;

            padding: 5px;
        }

        h2 {
            width: fit-content;
            padding: 3px 10px;
            background-color: darkblue;
            color: white;
            font-weight: 700;
            border-radius: 5px;
        }
        h2.connected {
            margin-bottom: 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            align-self: flex-start;
        }
        .has-header {
            border: 3px solid darkblue;
            border-radius: 5px;
            border-top-left-radius: 0;
        }

        /* --------- *\
           STOP LIST
        \* --------- */
        .stop-list {
            align-self: normal;

            display: flex;
            flex-direction: column;

            padding: 10px;
            gap: 5px;
        }
        .stop {
            display: flex;
            flex-direction: row;
        }
        .stop .name {
            flex-grow: 1;
            margin: auto;
            text-align: center;
        }

        /* -------------- *\
           ROUTE SELECTOR
        \* -------------- */
        .route-selector-modal {
            display: none;
            flex-direction: column;

            position: absolute;
            width: 100%;
            height: 100%;
            padding: 15px;
            background-color: #00000080;
        }
        .route-selector-wrapper {
            overflow: hidden;
            background-color: white;
        }
        :host([mode='route']) .route-selector-modal {
            display: flex;
        }
        route-selector {
            height: 100%;
        }
    `;

    render() {
        return html`
            <h2 class="connected">Current Bus Stops</h2>
            <div class="stop-list has-header">
                ${until(this.routesContent(), html`Loading routes...`)}
            </div>
            <bold-button @click=${() => (this.mode = 'route')}>
                Add stop</bold-button
            >

            <div class="route-selector-modal">
                <h2 class="connected">Add a stop</h2>
                <div class="route-selector-wrapper has-header">
                    <route-selector> </route-selector>
                </div>
            </div>
        `;
    }
    async routesContent() {
        await this.freshConfig;
        return html`${map(this.stops, ({addr, stopName}) => {
            return html`
                <div class="stop">
                    <div class="name">${stopName}</div>
                    <icon-button
                        icon="trash"
                        color="red"
                        @click=${() => this.removeStop(addr)}>
                    </icon-button>
                </div>
            `;
        })}`;
    }

    constructor() {
        super();

        this.reloadConfig();
    }

    /*------------*\
      DATA HELPERS
    \*------------*/
    reloadConfig() {
        this.freshConfig = this.getConfig();
        return this.freshConfig;
    }

    /*---*\
      API
    \*---*/
    async getConfig() {
        const url = '/config';
        const resp = await fetch(url);
        if (!resp.ok) {
            this.showError(resp);
            return;
        }

        const jsn = await resp.json();
        this.parseConfig(jsn);
    }

    parseConfig(config) {
        this.stops = config.stops.map((addr) => {
            const [routeName, stopName] = addr.split('/');
            return {addr, routeName, stopName};
        });
    }

    async removeStop(addr) {
        const url = '/config/stop';
        const method = 'DELETE';
        const body = addr;

        const resp = await fetch(url, {method, body});
        if (!resp.ok) {
            this.showError(resp);
            return;
        }

        await this.reloadConfig();
        this.requestUpdate();
    }

    showError(resp) {
        console.error(resp.url);
        console.error(resp.statusText);
    }
}
customElements.define('septa-configuration', SeptaConfiguration);
