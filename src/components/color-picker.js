import {LitElement, html, css, map} from '/lit-all.min.js';

export default class ColorPicker extends LitElement {
    static properties = {
        red: {type: Number, reflect: true},
        green: {type: Number, reflect: true},
        blue: {type: Number, reflect: true},
    };

    static styles = css`
        :host {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 2px;
            padding: 4px;

            border: 3px solid darkblue;
            border-radius: 5px;
        }

        .swatch-wrapper {
            aspect-ratio: 1/1;
            border: 4px solid transparent;
        }
        .swatch-wrapper:hover,
        .swatch-wrapper.selected {
            border-color: black;
            padding: 5px;
        }
        .swatch {
            aspect-ratio: 1/1;
            width: 40px;
            color: transparent;
        }
        .swatch-wrapper:hover .swatch,
        .swatch-wrapper.selected .swatch {
            width: 30px;
        }
    `;

    render() {
        const color = (level) => {
            if (level === 0) return 0;
            return Math.round(85 * level);
        };

        return html`
            ${map(
                this.colors(),
                ([r, g, b]) =>
                    html`
                        <div
                            class="swatch-wrapper"
                            @click=${this.onSwatchClick}>
                            <div
                                class="swatch"
                                style="background-color: rgb(
                                    ${color(r)},
                                    ${color(g)},
                                    ${color(b)}
                                );"
                                data-r=${r}
                                data-g=${g}
                                data-b=${b}></div>
                        </div>
                    `,
            )}
        `;
    }

    constructor() {
        super();
    }

    unselectAllSwatches() {
        this.renderRoot
            .querySelectorAll('.swatch-wrapper.selected')
            .forEach((wrapper) => wrapper.classList.remove('selected'));
    }

    /*---*\
      API
    \*---*/
    setSelectedColor(red, green, blue) {
        this.unselectAllSwatches();

        if (red && blue && green) {
            // Save incoming colors
            this.red = red;
            this.green = green;
            this.blue = blue;

            // Higlight swatch
            const swatch = this.renderRoot.querySelector(
                `.swatch[data-r="${red}"][data-g="${green}"][data-b="${blue}"]`,
            );
            swatch.closest('.swatch-wrapper').classList.add('selected');
        } else {
            // Save null if any one color is missing
            this.red = null;
            this.green = null;
            this.blue = null;
        }
    }

    /*---------------*\
      COLOR UTILITIES
    \*---------------*/
    getSelectedColor() {
        return [parseInt(this.red), parseInt(this.green), parseInt(this.blue)];
    }

    *colors() {
        const colorLevels = 4;
        for (let r = 0; r < colorLevels; r++) {
            for (let g = 0; g < colorLevels; g++) {
                for (let b = 0; b < colorLevels; b++) {
                    yield [r, g, b];
                }
            }
        }
    }

    /*--------------*\
      EVENT HANDLERS
    \*--------------*/
    onSwatchClick(event) {
        // Get selected color
        const swatch = event.currentTarget.querySelector('.swatch');
        this.red = swatch.dataset.r;
        this.green = swatch.dataset.g;
        this.blue = swatch.dataset.b;

        // Unselect all swatches
        this.unselectAllSwatches();

        // Select this swatch
        event.currentTarget.classList.add('selected');
    }
}
customElements.define('color-picker', ColorPicker);
