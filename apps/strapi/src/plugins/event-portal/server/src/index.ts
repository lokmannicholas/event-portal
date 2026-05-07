import contentTypes from './content-types';
import controllers from './controllers';
import middlewares from './middlewares';
import routes from './routes';
import services from './services';
import { register } from './register';
import { bootstrap } from './bootstrap';

export default {
  register,
  bootstrap,
  contentTypes,
  controllers,
  middlewares,
  routes,
  services,
};
