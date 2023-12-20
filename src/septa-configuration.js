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
            height: 100vh;

            display: flex;
            flex-direction: column;
            align-items: center;
        }

        h2 {
            width: fit-content;
            margin: 0;

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

        bold-button {
            margin-top: 20px;
        }

        /* --------- *\
           STOP LIST
        \* --------- */
        .stop-list-wrapper {
            margin: 5px;
        }

        .stop-list {
            align-self: normal;

            display: flex;
            flex-direction: column;

            padding: 10px;
            gap: 5px;
        }

        .route {
            display: flex;
            flex-direction: column;

            border: 2px solid #cadeff;
            border-radius: 5px;
        }
        .route > .name {
            text-align: center;
            padding: 5px;
            background-color: #cadeff;
        }

        .stop {
            display: flex;
            flex-direction: row;
            margin: 5px;
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
            box-sizing: border-box;
            display: none;
            flex-direction: column;

            position: absolute;
            width: 100%;
            height: 100%;
            padding: 15px;
            background-color: #00000080;
        }
        .route-selector-modal .headers {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            padding-right: 20px;
        }
        .route-selector-modal .close {
            cursor: pointer;
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
            <div class="stop-list-wrapper">
                <h2 class="connected">Current Bus Stops</h2>
                <div class="stop-list has-header">
                    ${until(this.routesContent(), html`Loading routes...`)}
                </div>
            </div>

            <bold-button @click=${() => (this.mode = 'route')}>
                Add stop
            </bold-button>

            <div class="route-selector-modal">
                <div class="headers">
                    <h2 class="connected">Add a stop</h2>
                    <h2 class="connected close" @click=${this.goHome}>X</h2>
                </div>
                <div class="route-selector-wrapper has-header">
                    <route-selector @select=${this.goHome}> </route-selector>
                </div>
            </div>
        `;
    }
    async routesContent() {
        await this.freshConfig;

        const stopsByRoute = {};
        this.config.stops.forEach((stop) => {
            const name = `${stop.routeName}`;

            stopsByRoute[name] ||= [];
            stopsByRoute[name].push(stop);
        });

        return html`${map(
            Object.entries(stopsByRoute),
            ([routeName, stops]) =>
                html`
                    <div class="route">
                        <div class="name">${routeName}</div>
                        ${map(
                            stops,
                            ({stopName, addr}) => html`
                                <div class="stop">
                                    <div class="name">${stopName}</div>
                                    <icon-button
                                        icon="trash"
                                        color="red"
                                        @click=${() => this.removeStop(addr)}>
                                    </icon-button>
                                </div>
                            `,
                        )}
                    </div>
                `,
        )}`;
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

        this.config = await resp.json();
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

    /*--------------*\
      EVENT HANDLERS
    \*--------------*/
    goHome = () => {
        this.mode = '';
        this.reloadConfig();
    };
}
customElements.define('septa-configuration', SeptaConfiguration);
