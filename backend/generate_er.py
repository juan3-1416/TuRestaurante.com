import django
from django.apps import apps

def generate_er():
    django.setup()
    print('erDiagram')
    
    app_labels = ['users', 'tables', 'reservations', 'reports', 'orders', 'inventory', 'cashier']
    
    for model in apps.get_models():
        if model._meta.app_label not in app_labels:
            continue
            
        model_name = model.__name__
        print(f'  {model_name} {{')
        
        for field in model._meta.get_fields():
            if not field.is_relation:
                field_type = field.get_internal_type()
                print(f'    {field_type} {field.name}')
            elif field.many_to_one or field.one_to_one:
                field_type = 'Relation'
                print(f'    {field_type} {field.name}')
                
        print('  }')
        
        for field in model._meta.get_fields():
            if getattr(field, 'auto_created', False):
                continue
            if field.is_relation and field.many_to_one:
                related_model = field.related_model.__name__
                print(f'  {model_name} }}o--|| {related_model} : "{field.name}"')
            elif field.is_relation and field.one_to_one:
                related_model = field.related_model.__name__
                print(f'  {model_name} ||--|| {related_model} : "{field.name}"')
            elif field.is_relation and field.many_to_many:
                related_model = field.related_model.__name__
                print(f'  {model_name} }}o--o{{ {related_model} : "{field.name}"')

if __name__ == "__main__":
    generate_er()
