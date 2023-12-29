import {LitElement, html, css, map, until} from '/lit-all.min.js';

import './components/route-selector.js';
import './components/icon-button.js';
import './components/bold-button.js';
import './components/color-picker.js';
import './components/sign-schedule.js';

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
            flex-shrink: 1;
            overflow: hidden;
        }

        bold-button {
            margin-top: 20px;
        }

        /* --------- *\
           STOP LIST
        \* --------- */
        .stop-list-wrapper {
            box-sizing: border-box;
            padding: 5px;
            width: 100%;
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
            gap: 5px;
        }
        .stop .name {
            flex-grow: 1;
            margin: auto;
            text-align: center;
        }

        /* ------- *\
           TOOLBAR
        \* ------- */
        .toolbar {
            display: flex;
            gap: 15px;
        }

        /* ------ *\
           MODALS
        \* ------ */
        .modal {
            box-sizing: border-box;
            display: none;
            flex-direction: column;

            position: absolute;
            width: 100%;
            height: 100%;
            padding: 15px;
            background-color: #00000080;
        }
        .modal .headers {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            padding-right: 20px;
        }
        .modal .close {
            cursor: pointer;
        }

        /* -------------- *\
           ROUTE SELECTOR
        \* -------------- */
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

        /* ------ *\
           CONFIG
        \* ------ */
        :host([mode='config']) .config-modal {
            display: flex;
        }
        .config-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
            gap: 20px;

            padding: 20px;
            background-color: white;
        }
        .color-pickers-container {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }
        .config-modal color-picker {
            width: fit-content;
            margin: auto;
        }
        #nickname {
            padding: 20px;
        }

        /* -------------- *\
           SCHEDULE MODAL
        \* -------------- */
        :host([mode='schedule']) .sign-schedule-modal {
            display: flex;
        }
        sign-schedule {
            height: 100%;
        }
    `;

    render() {
        const {routeColor, arrivalColor} = this.displayConfig ?? {};

        return html`
            <div class="stop-list-wrapper">
                <h2 class="connected">Current Bus Stops</h2>
                <div class="stop-list has-header">
                    ${until(this.routesContent(), html`Loading routes...`)}
                </div>
            </div>

            <div class="toolbar">
                <bold-button @click=${() => (this.mode = 'route')}>
                    Add stop
                </bold-button>
                <bold-button @click=${() => (this.mode = 'schedule')}>
                    Update schedule
                </bold-button>
            </div>

            <div class="config-modal modal">
                <div class="headers">
                    <h2 class="connected">Configure</h2>
                    <h2 class="connected close" @click=${this.goHome}>X</h2>
                </div>

                <div class="config-wrapper has-header">
                    <div class="color-pickers-container">
                        <div>
                            <h2 class="connected">Route Number</h2>
                            <color-picker
                                id="route-number-color"
                                class="has-header"></color-picker>
                        </div>
                        <div>
                            <h2 class="connected">Arrival Info</h2>
                            <color-picker
                                id="arrival-color"
                                class="has-header"></color-picker>
                        </div>
                    </div>

                    <div class="nickname-container">
                        <h2 class="connected">Nickname</h2>
                        <input id="nickname" class="has-header" maxlength="5" />
                    </div>

                    <bold-button @click=${this.onConfigSaveClick}>
                        Save
                    </bold-button>
                </div>
            </div>

            <div class="route-selector-modal modal">
                <div class="headers">
                    <h2 class="connected">Add a stop</h2>
                    <h2 class="connected close" @click=${this.goHome}>X</h2>
                </div>
                <div class="route-selector-wrapper has-header">
                    <route-selector @select=${this.goHome}> </route-selector>
                </div>
            </div>

            <div class="sign-schedule-modal modal">
                <div class="headers">
                    <h2 class="connected">Update Schedule</h2>
                    <h2 class="connected close" @click=${this.goHome}>X</h2>
                </div>
                <div class="sign-schedule-wrapper has-header">
                    <sign-schedule @done=${this.goHome}> </sign-schedule>
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
                                        icon="gear"
                                        color="blue"
                                        @click=${() =>
                                            this.onConfigClick(addr)}>
                                    </icon-button>
                                    <icon-button
                                        icon="trash"
                                        color="red"
                                        @click=${() =>
                                            this.onRemoveStopClick(addr)}>
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

    async getDisplayConfig(addr) {
        const url = `/config/${addr}`;
        const resp = await fetch(url);
        if (!resp.ok) {
            this.showError(resp);
            return;
        }

        const jsn = await resp.json();
        jsn.addr = addr;
        return jsn;
    }

    async setDisplayConfig(addr, config) {
        const url = `/config/${addr}`;
        const method = 'PUT';
        const headers = {'Content-Type': 'application/json'};
        const body = JSON.stringify(config);

        const resp = await fetch(url, {method, headers, body});
        if (!resp.ok) {
            this.showError(resp);
            return;
        }

        await this.reloadConfig();
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
    async onConfigClick(addr) {
        // Fetch config
        this.displayConfig = await this.getDisplayConfig(addr);

        // Apply config to modal inputs
        this.renderRoot
            .getElementById('route-number-color')
            .setSelectedColor(...this.displayConfig.routeColor);
        this.renderRoot
            .getElementById('arrival-color')
            .setSelectedColor(...this.displayConfig.arrivalColor);

        if (this.displayConfig.nickname) {
            this.renderRoot.getElementById('nickname').value =
                this.displayConfig.nickname;
        }

        this.mode = 'config';
    }
    async onConfigSaveClick() {
        // Get address
        const addr = this.displayConfig.addr;

        // Get color pickers
        const routePicker =
            this.renderRoot.getElementById('route-number-color');
        const arrivalPicker = this.renderRoot.getElementById('arrival-color');

        // Get selected colors
        const config = {
            routeColor: routePicker.getSelectedColor(),
            arrivalColor: arrivalPicker.getSelectedColor(),
        };

        // Get nickname
        const nickname = this.renderRoot.getElementById('nickname').value;
        if (nickname) config.nickname = nickname;

        // Send update
        console.log(`Setting config for ${addr}:`);
        console.log(config);
        await this.setDisplayConfig(addr, config);
        this.goHome();
    }

    onDeleteClick(addr) {
        this.removeStop(addr);
    }

    goHome = () => {
        this.mode = '';
        this.reloadConfig();
    };
}
customElements.define('septa-configuration', SeptaConfiguration);
