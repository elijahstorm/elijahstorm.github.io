
class PortfolioContent {
  constructor(output, btn) {
    this.#output_container = output;
    this.#activate_button = btn;
  }

  #shown_index = 0;
  #finished_last_request = true;

  #activate_button;
  #output_container;

  #read_text_file = (resolve, reject, path) => {
    const rawFile = new XMLHttpRequest();

    rawFile.open('GET', path, false);

    rawFile.onreadystatechange = () => {
      if(rawFile.readyState === 4) {
        if(rawFile.status === 200 || rawFile.status == 0) {
          resolve(rawFile.responseText);
          return;
        }
      }

      reject('bad file');
    }

    rawFile.send(null);
  };

  show_more = () => {
    if (!this.#finished_last_request) return;

    this.#finished_last_request = false;

    new Promise((resolve, reject) => {
      this.#read_text_file(resolve, reject, `portfolio/port.data.${this.#shown_index}.html`);
    })
      .then((html_content) => {
        const container = this.#output_container;

        container.innerHTML += html_content;
        this.#shown_index++;

        new Promise((resolve, reject) => {
          this.#read_text_file(resolve, reject, `portfolio/port.data.${this.#shown_index}.html`);
        })
          .then(() => {}, () => {
            this.#activate_button.parentElement.remove();
          })

        this.#finished_last_request = true;
      }, (error_code) => {
        console.error(error_code);

        this.#activate_button.parentElement.remove();

        this.#finished_last_request = true;
      });
  };
};

const __intake_new_content = new PortfolioContent(
  document.getElementById('portfolio-content'),
  document.getElementById('portfolio-show-more'),
);

document.getElementById('portfolio-show-more').onclick = () => {
  __intake_new_content.show_more();
};

__intake_new_content.show_more();
