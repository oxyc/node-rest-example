
all: build


build: $(patsubst %.tex,%.pdf,$(wildcard *.tex))

%.pdf: %.tex
	@pdflatex $<

clean:
	@rm -f *.aux *.bbl *.blg *.lof *.lot *.log *.toc *.lol *.1 *.out
