# Instructions pour redémarrer le backend

## Ce qui a été ajouté:

1. **Module Tasks complet** avec:
   - Entity: `Task` avec status (TODO, IN_PROGRESS, DONE, BLOCKED) et priority (LOW, MEDIUM, HIGH)
   - DTOs: CreateTaskDto, UpdateTaskDto
   - Service: TasksService avec CRUD complet
   - Controller: TasksController avec tous les endpoints
   - Module: TasksModule

2. **Endpoints disponibles**:
   - `POST /tasks` - Créer une tâche
   - `GET /tasks/business/:businessId` - Récupérer toutes les tâches d'un business
   - `GET /tasks/:id` - Récupérer une tâche
   - `PATCH /tasks/:id` - Mettre à jour une tâche
   - `DELETE /tasks/:id` - Supprimer une tâche

3. **Sécurité**:
   - Tous les endpoints nécessitent l'authentification JWT
   - Vérification d'accès au business via BusinessMembersService
   - Seuls les membres du business peuvent voir/modifier les tâches

## Pour redémarrer:

```bash
cd PI-DEV-BACKEND
npm run start:dev
```

## Vérifications après redémarrage:

1. La table `tasks` devrait être créée automatiquement dans PostgreSQL
2. Les endpoints `/tasks` devraient être disponibles
3. Vous devriez pouvoir créer des tâches depuis le frontend

## Si vous avez toujours l'erreur 401:

Vérifiez que vous êtes bien connecté dans le frontend. L'erreur 401 sur `/auth/me` indique que la session n'est pas active.

Solution: Reconnectez-vous dans l'application frontend.
