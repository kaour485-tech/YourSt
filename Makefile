all:
	@mkdir -p dist/shots
	@cp index.html script.js styles.css dist/
	@cp shots/*.png dist/shots/

