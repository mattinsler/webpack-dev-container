NAME := webpack-dev-container

build:
	@docker build -t $(NAME) .
