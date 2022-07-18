
class PortfolioContent {
  constructor(output, btn) {
    this.#output_container = output;
    this.#activate_button = btn;

    if (btn == null) return;

    btn.onclick = () => {
      this.show_more();
    };
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
    };

    rawFile.send(null);
  };

  #wrap = (index) => index < 0 ? index + 4 : index;

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
        document.querySelectorAll('.open-on-click').forEach((el) => {
        	el.addEventListener('click', () => {
            if (el.parentElement.classList.contains('opened')) {
              el.parentElement.classList.remove('opened');
            }
            else {
              el.parentElement.classList.add('opened');
            }
        	});
        });

        new Promise((resolve, reject) => {
          this.#read_text_file(resolve, reject, `portfolio/port.data.${this.#shown_index}.html`);
        })
          .then(() => {}, () => {
            this.#activate_button.parentElement.remove();
          });

        const arrows = document.querySelectorAll('#portfolio-content>div>div.arrow-left');
        arrows.forEach((arrow) => {

          const section = arrow.parentElement.querySelector('section');
          setTimeout(() => {
            section.style.height = `${section.children[0].height}px`;
          }, 3000);

          let allow_navigation = true;

          arrow.onclick = (e) => {
            e.stopImmediatePropagation();

            if (!allow_navigation) return;

            allow_navigation = false;

            const images = section.children;

            for (let index = 0; index < images.length; index++) {

              const image = images[index];

              if (!image.classList.contains('active')) continue;

              const next_index = this.#wrap(
                index + (
                  arrow.classList.contains('flip')
                    ? 1
                    : -1
                )
              ) % images.length;

              const next = images[next_index];

              const highlights = arrow.parentElement.querySelector('.pagination').children;

              next.classList.add('active');
              image.classList.remove('active');
              highlights[index].classList.remove('active');
              highlights[next_index].classList.add('active');

              if (next.height != null && next.height != 0) {
                section.style.height = `${next.height}px`;
              }

              allow_navigation = true;

              return;
            }
          };

        });

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

__intake_new_content.show_more();
