from django.http import JsonResponse

def hello(request):
    return JsonResponse({"message": "Hello Ông chủ"}, json_dumps_params={"ensure_ascii": False})