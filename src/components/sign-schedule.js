import {LitElement, html, css, map, until, guard} from '../lit-all.min.js';

import '../components/bold-button.js';

export default class SignSchedule extends LitElement {
    static properties = {
        editMode: {type: Boolean, reflect: true},
    };

    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            overflow-y: scroll;

            background-color: white;
            font-size: var(--font-size);
        }

        /* ---- *\
           GRID
        \* ---- */
        .row {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
        }

        .column {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        .column:not(:last-child) {
            border-right: 2px solid darkblue;
        }

        .sticky {
            position: sticky;
            top: 0;

            text-align: center;
            background-color: white;
            border-bottom: 2px dashed darkblue;
        }

        /* ------------- *\
           GRID CONTENTS
        \* ------------- */
        h3 {
            margin: 0;
            padding: 1rem 0;
        }

        .alternate-cell:nth-child(even) {
            background-color: lightgrey;
        }

        .highlight {
            background-color: lightblue !important;
        }

        /* ---------- *\
           EDIT MODAL
        \* ---------- */
        .edit-modal {
            position: absolute;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: stretch;

            gap: 10px;
            padding: 10px;
            background-color: white;
            border: 3px solid lightblue;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);

            opacity: 0;
            pointer-events: none;
        }
        :host([editmode]) .edit-modal {
            opacity: 1;
            pointer-events: all;
        }

        .edit-modal .row {
            gap: 10px;
        }

        .edit-modal input {
            border: 2px solid darkblue;
            border-radius: 5px;
            padding: 5px 10px;
            font-weight: bold;
            color: darkblue;
        }
    `;

    render() {
        return html`
            ${until(this.scheduleContent(), html`Loading schedule...`)}
        `;
    }

    async scheduleContent() {
        if (!this.schedule) await this.getSchedule();
        const dayNames = [
            'Sat-Sun',
            'Sun-Mon',
            'Mon-Tue',
            'Tue-Wed',
            'Wed-Thur',
            'Thur-Fri',
            'Fri-Sat',
        ];
        const tzOffset = Math.round(new Date().getTimezoneOffset() / 60);

        return html`
            <div class="row" @click=${this.closeModal}>
                ${guard([this.schedule, this.editDay, this.editHour], () =>
                    map(
                        this.schedule,
                        (day, dayIdx) => html`
                            <div class="column">
                                <h3 class="sticky">${dayNames[dayIdx]}</h3>
                                ${map(day, (hour, hourIdx) => {
                                    // Should this cell be highlighted?
                                    const d = dayIdx === this.editDay;
                                    const h = hourIdx === this.editHour;
                                    const highlight =
                                        d && h ? 'highlight' : null;

                                    // What does this UTC hour mean locally?
                                    const tzHour =
                                        (hourIdx - tzOffset + 24) % 24;
                                    const hour12 = (tzHour % 12) + 1;
                                    const ampm = tzHour < 12 ? 'am' : 'pm';

                                    return html`
                                        <div
                                            class="row alternate-cell ${highlight}">
                                            <h4>${hour12}${ampm}</h4>
                                            <bold-button
                                                slim
                                                color="${hour
                                                    ? '#7878ad'
                                                    : 'grey'}"
                                                bordercolor="${hour
                                                    ? 'darkblue'
                                                    : 'black'}"
                                                .dayIdx=${dayIdx}
                                                .hourIdx=${hourIdx}
                                                @click=${this.onHourClick}>
                                                ${hour
                                                    ? hour
                                                          .split('.')[0]
                                                          .slice(0, 7)
                                                    : 'arrivals'}
                                            </bold-button>
                                        </div>
                                    `;
                                })}
                            </div>
                        `,
                    ),
                )}
            </div>

            <div
                class="edit-modal"
                style="left: ${this.editModalLeft}px;
                               top: ${this.editModalTop}px">
                <div class="row">
                    <bold-button @click=${this.onSetArrivals}>
                        Show arrivals
                    </bold-button>
                    <bold-button @click=${this.onSetImage}>
                        Show an image
                    </bold-button>
                </div>
                <input type="text" value="${this.editModalPath}" />
            </div>
        `;
    }

    constructor() {
        super();
    }

    highlightCell(button) {
        // Clear highlights
        this.renderRoot
            .querySelectorAll('.alternate-cell.highlight')
            .forEach((b) => b.classList.remove('highlight'));

        // Add cell highlight
        if (!button) return;
        button.closest('.alternate-cell').classList.add('highlight');
    }
    closeModal() {
        this.editMode = false;
        this.editDay = null;
        this.editHour = null;
        this.requestUpdate();
    }

    /*--------------*\
      EVENT HANDLERS
    \*--------------*/
    onHourClick(event) {
        // Where in the schedule are we?
        const button = event.target;
        const {dayIdx, hourIdx} = button;

        // If this is the same day that we're already editing, let the modal close
        if (
            this.editMode &&
            dayIdx === this.editDay &&
            hourIdx === this.editHour
        ) {
            return;
        } else {
            // Prevent the modal from closing
            event.stopPropagation();
        }

        this.editDay = dayIdx;
        this.editHour = hourIdx;

        // Get values we'll need to position the modal
        const {
            x: sX,
            y: sY,
            width: sW,
            height: sH,
        } = this.getBoundingClientRect();
        let {
            x: bX,
            y: bY,
            width: bW,
            height: bH,
        } = button.getBoundingClientRect();
        bX -= sX;
        bY -= sY;
        bY += this.scrollTop;

        const modal = this.renderRoot.querySelector('.edit-modal');
        const {width: mW, height: mH} = modal.getBoundingClientRect();

        // Set the modal's X position
        const buttonOnLeft = bX + bW / 2 < sW / 2;
        if (buttonOnLeft) {
            // Put the modal to the right of the button
            this.editModalLeft = bX + bW + 10;
        } else {
            // Put the modal to the left of the button
            this.editModalLeft = bX - mW - 60;
        }

        // Set the modal's Y position
        this.editModalTop = (Math.min(sH - mH), bY - mH / 2);

        // Set the path value
        this.editModalPath = this.schedule[dayIdx][hourIdx];

        // Bring up editor modal
        this.editMode = true;
        this.requestUpdate();
    }

    onSetArrivals() {
        this.schedule[this.editDay][this.editHour] = null;

        this.updateSchedule();
        this.closeModal();
    }

    onSetImage() {
        // Get path name
        const imagePath =
            this.renderRoot.querySelector('.edit-modal input').value;

        this.schedule[this.editDay][this.editHour] = imagePath;

        this.updateSchedule();
        this.closeModal();
    }

    /*---*\
      API
    \*---*/
    async getSchedule() {
        // Fetch schedule
        const resp = await fetch('./schedule');
        const jsn = await resp.json();

        // Ensure each day has 24 hours
        jsn.forEach((day) => {
            while (day.length < 24) {
                day.push(null);
            }
        });

        // Save schedule
        this.schedule = jsn;
        return this.schedule;
    }

    async updateSchedule() {
        // Prepare request
        const url = './schedule';
        const method = 'PUT';
        const headers = {'Content-Type': 'application/json'};
        const body = JSON.stringify(this.schedule);

        // Send request
        const resp = await fetch(url, {method, headers, body});
    }
}
customElements.define('sign-schedule', SignSchedule);
