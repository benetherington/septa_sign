import {LitElement, html, css, until, map} from '/lit-all.min.js';

export default class StopSelector extends LitElement {
    static properties = {
        selectedRouteId: {type: String, reflect: true},
        selectedStopId: {type: String, reflect: true},
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

        .stop {
            cursor: pointer;
        }
        .stop:hover {
            background-color: #cadeff80;
        }
        .stop.selected {
            background-color: #cadeff;
        }
    `;

    render() {
        return html`
            <div class="list-container">
                ${this.selectedRouteId
                    ? until(this.stopsContent(), this.loadingContent())
                    : html`Select a route`}
            </div>
        `;
    }

    async stopsContent() {
        if (!this.stops) this.stops = await this.getStops();
        return html`
            ${map(this.stops, ({stopname, stopid}) => {
                const selected = stopid === this.selectedStopId;
                return html`
                    <div
                        class="stop ${selected ? 'selected' : ''}"
                        data-id="${stopid}"
                        @click=${this.stopClick}>
                        ${stopname}
                    </div>
                `;
            })}
        `;
    }
    loadingContent() {
        return html`Loading stops...`;
    }

    constructor() {
        super();

        this.selectedRouteId = null;
    }

    async getStops() {
        const url = `/septa/bus/route/${this.selectedRouteId}`;
        const resp = await fetch(url);
        return resp.json();
    }

    stopClick(event) {
        this.selectedStopId = event.target.dataset.id;
        this.dispatchEvent(new Event('select'));
    }
}
customElements.define('stop-selector', StopSelector);
