function setAttributes(elem, attrs) {
    for (var idx in attrs) {
        if ((idx === 'styles' || idx === 'style') && typeof attrs[idx] === 'object') {
            const styles = [];
            for (var prop in attrs[idx]) { styles.push(`${prop}: ${attrs[idx][prop]};`); }
            elem.setAttribute('style', styles.join(' '));
        } else if (idx === 'html') {
            elem.innerHTML = attrs[idx];
        } else {
            elem.setAttribute(idx, attrs[idx]);
        }
    }
}

function setClassName(elem, classes) {
    var classValues = elem.className.baseVal.split(" ");
    if ('type' in classes) {
        classValues[0] = classes.type;
    }
    if ('color' in classes) {
        classValues[1] = classes.color;
    }
    if ('visibility' in classes) {
        classValues[2] = classes.visibility;
    }
    elem.setAttribute('class', classValues.join(' '));
}

function createSvgElement(tag, attributes = null) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (typeof attributes === 'object') {
        setAttributes(elem, attributes);
    }
    return elem;
}


class Fretboard {
    constructor(opts) {
        this.svg = opts.svg;
        this.consts = {
            offsetX: 30,
            offsetY: 30,
            stringIntervals: [24, 19, 15, 10, 5, 0],
            numFrets: 12,
            fretWidth: 70,
            stringSpacing: 40,
            minStringSize: 0.2,
            circleRadius: 18,
            notes: ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
        };

        this.state = {
            selected: null,
            visibility: 'transparent',
        };
        this.consts.numStrings = this.consts.stringIntervals.length;
        this.consts.fretHeight = (this.consts.numStrings - 1) * this.consts.stringSpacing;
        this.consts.fretboardWidth = this.consts.fretWidth * this.consts.numFrets;
        this.draw();
    }

    draw() {
        this.drawFrets();
        this.drawMarkers();
        this.drawStrings();
        this.drawNotes();
        this.addEditableDiv();

        this.svg.addEventListener('click', () => {
            if (this.state.selected) {
                setClassName(this.state.selected, {
                    visibility: 'visible',
                });
                this.state.selected = null;
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!this.state.selected || !event.code || this.selectedText) {
                return;
            }
            const selected = this.state.selected;
            switch (event.code) {
                case 'Backspace':
                case 'Delete':
                    // reset text
                    const text = selected.children[1];
                    if (text) {
                        text.innerHTML = text.getAttribute('data-note');
                    }
                    setClassName(selected,
                        { color: "white", visibility: this.state.visibility });
                    this.state.selected = null;
                    break;
                case 'KeyB':
                    setClassName(selected, { color: "blue" });
                    break;
                case 'KeyG':
                    setClassName(selected, { color: "green" });
                    break;
                case "KeyW":
                    setClassName(selected, { color: "white" });
                    break;
                case "KeyR":
                    setClassName(selected, { color: "red" });
                    break;
            }
        })
    }

    drawFrets() {
        var pathSegments = ["M " + this.consts.offsetX + " " + this.consts.offsetY];
        for (let i = 0; i < this.consts.numFrets + 1; i++) {
            let factor = i % 2 == 0 ? 1 : -1;
            pathSegments.push("v " + (factor) * this.consts.fretHeight);
            pathSegments.push("m " + this.consts.fretWidth + " " + 0);
        }
        const path = pathSegments.join(" ");


        const frets = createSvgElement('path', {
            'class': 'frets',
            'd': path,
        });
        this.svg.appendChild(frets);
    }

    drawMarkers() {
        const markers = createSvgElement('g', {
            class: 'markers'
        });
        for (let i of [2, 4, 6, 8]) {
            const marker = createSvgElement('circle', {
                class: 'marker',
                cx: this.consts.offsetX + i * this.consts.fretWidth + (this.consts.fretWidth / 2),
                cy: this.consts.offsetY + this.consts.fretHeight + this.consts.stringSpacing,
                r: 5,
            })
            markers.appendChild(marker);
        }
        this.svg.appendChild(markers);

        for (let i of [-10, 10]) {
            const marker = createSvgElement('circle', {
                class: 'marker',
                cx: this.consts.offsetX + 11 * this.consts.fretWidth + (this.consts.fretWidth / 2) + i,
                cy: this.consts.offsetY + this.consts.fretHeight + this.consts.stringSpacing,
                r: 5,
            })
            markers.appendChild(marker);
        }
    }

    drawStrings() {
        this.strings = createSvgElement('g', {
            'class': 'strings',
        })
        this.svg.appendChild(this.strings);
        for (let i = 0; i < this.consts.numStrings; i++) {
            let path = "M " + this.consts.offsetX + " " + (this.consts.offsetY + i * this.consts.stringSpacing) + " h " + this.consts.fretboardWidth;
            const string = createSvgElement('path', {
                'class': 'string',
                'd': path,
                'styles': {
                    'stroke-width': this.consts.minStringSize * (i + 1),
                }
            });
            this.strings.appendChild(string);
        }
    }

    drawNotes() {
        this.notes = createSvgElement('g', {
            'class': 'notes',
        })
        this.svg.appendChild(this.notes);
        for (let i = 0; i < this.consts.numFrets; i++) {
            for (let j = 0; j < this.consts.numStrings; j++) {
                const x = this.consts.offsetX + (this.consts.fretWidth / 2) + this.consts.fretWidth * i;
                const y = this.consts.offsetY + this.consts.stringSpacing * j;
                const note = createSvgElement('g', {
                    'transform': "translate(" + x + "," + y + ")",
                    'data-x': x,
                    'data-y': y,
                });
                setClassName(note,
                    { type: 'note', color: 'white', visibility: this.state.visibility });
                this.notes.appendChild(note);
                note.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const note = event.currentTarget;
                    if (this.state.selected) {
                        setClassName(this.state.selected, {
                            visibility: 'visible',
                        });
                    }
                    setClassName(note, {
                        visibility: 'selected',
                    });
                    this.state.selected = note;

                    if (event.ctrlKey) {
                        this.editSelectedLabel();
                    }
                });

                const circle = createSvgElement('circle', {
                    'r': this.consts.circleRadius,
                });
                note.appendChild(circle);

                // compute name of note
                let interval = this.consts.stringIntervals[j] + i + 1;
                let noteName = this.consts.notes[interval % 12];
                const text = createSvgElement('text', {
                    'data-note': noteName,
                });
                text.innerHTML = noteName;
                note.appendChild(text);
            }
        }
    }

    addEditableDiv() {
        this.editableText = createSvgElement('foreignObject', {
            class: 'hidden',
        });
        const div = document.createElement('div');
        div.setAttribute('contentEditable', 'true');
        div.setAttribute('id', 'editable-div')
        div.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (event.code === 'Enter') {
                event.target.blur();
            }
        });
        div.addEventListener('blur', (event) => {
            this.selectedText.innerHTML = this.editableText.children[0].innerHTML;
            this.editableText.children[0].innerHTML = '';
            setAttributes(this.selectedText, {
                styles: {
                    display: 'block',
                }
            });
            setAttributes(this.editableText, {
                styles: {
                    display: 'none',
                }
            });
            this.selectedText = null;
        })
        this.editableText.appendChild(div);
        this.svg.appendChild(this.editableText);
    }

    editSelectedLabel() {
        const selected = this.state.selected;
        const x = selected.getAttribute('data-x');
        const y = selected.getAttribute('data-y');
        setAttributes(this.editableText, {
            x: x - this.consts.circleRadius,
            y: y - this.consts.circleRadius + 4,
            height: 2 * this.consts.circleRadius,
            width: 2 * this.consts.circleRadius,
            class: 'visible',
            styles: {
                display: 'block',
            }
        });

        this.selectedText = selected.children[1];
        setAttributes(this.selectedText, {
            styles: {
                display: 'none',
            }
        });

        this.editableText.children[0].innerHTML = this.selectedText.innerHTML;
        this.editableText.children[0].focus();
        // select all text in editable div
        document.execCommand('selectAll', false, null);
    }

    toggleVisibility() {
        for (let note of this.notes.children) {
            if (note.className.baseVal.endsWith('visible') || note.className.baseVal.endsWith('selected')) {
                continue;
            }
            this.state.visibility = note.className.baseVal.endsWith('hidden') ? 'transparent' : 'hidden';
            setClassName(note, {
                visibility: this.state.visibility,
            })
        }
    }

    clearSelection() {
        if (this.state.selected) {
            setClassName(this.state.selected, {
                visibility: 'visible',
            });
            this.state.selected = null;
        }
    }

    reset() {
        for (let note of this.notes.children) {
            // reset text
            const text = note.children[1];
            if (text) {
                text.innerHTML = text.getAttribute('data-note');
            }
            setClassName(note,
                { color: "white", visibility: this.state.visibility });
            this.state.selected = null;
            this.state.selectedText = null;
        }
    }
}

/* Main */

/* Initialize diagram */

const svg = document.getElementById('fretboard');

const fretboard = new Fretboard({
    svg: svg,
})

/* Button for toggeling unselected notes */

const togglebutton = document.getElementById('visibility');
togglebutton.addEventListener('click', (event) => {
    fretboard.toggleVisibility();
});

/* Save SVG button */

var svgButton = document.getElementById('save-svg');
const svgLink = document.getElementById('svg-link');

svgButton.addEventListener('click', () => {
    fretboard.clearSelection();
    const svgCopy = inlineCSS(svg);
    var svgData = svgCopy.outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    svgLink.href = svgUrl;
    svgLink.click();
});

const PROPERTIES = ["fill", "stroke", "stroke-width", "text-anchor", "dominant-baseline"]

function inlineCSS(svg) {
    const svgElements = document.querySelectorAll("svg *");
    const clonedSVG = svg.cloneNode(deep = true);
    const clonedElements = clonedSVG.querySelectorAll("*");
    for (let i = 0; i < svgElements.length; i++) {
        const computedStyle = getComputedStyle(svgElements[i]);
        // remove invisible elements to reduce file size
        const opacity = computedStyle.getPropertyValue('opacity');
        if (opacity === '0') {
            clonedElements[i].remove();
            continue;
        }
        const styles = {opacity: opacity}
        for (let attr of PROPERTIES) {
            let value = computedStyle.getPropertyValue(attr);
            if (value) {
                styles[attr] = value;
            }
        }
        setAttributes(clonedElements[i], {
            'styles': styles,
        });
    }
    return clonedSVG;
}

/* Reset button */

var resetButton = document.getElementById('reset');
resetButton.addEventListener('click', (event) => {
    const doReset = window.confirm("Do you really want to reset your diagram?");
    if (doReset) {
        fretboard.reset();
    }
});