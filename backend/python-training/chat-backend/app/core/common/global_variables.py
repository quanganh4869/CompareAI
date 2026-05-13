from starlette_context import context


def set_current_user(user):
    if user:
        context.data.update({"user": user})


def set_current_request(request):
    context.data.update({"request": request})


def get_current_user():
    """
    return -> Account Object | None:
    """
    user = context.data.get("user")

    if not user:
        return None

    return user


def get_current_user_id() -> int | None:
    user = context.data.get("user")

    if not user:
        return None

    return user.id


def get_current_request():
    request = context.data.get("request")

    if not request:
        return None

    return request
