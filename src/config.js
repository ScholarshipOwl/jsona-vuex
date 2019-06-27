import { Jsona } from 'jsona';

export default {
  /**
   * Jsona object
   * @type {object}
   */
  jsona: new Jsona(),
  /**
   * HTTP method will be used for sending update requests
   * @type {String}
   */
  updateMethod: 'patch',
  /**
   * HTTP Client that will be used to send requests
   * @type {Object|Function}
   */
  httpClient: null,
  /**
   * HTTP client configurations send with each request.
   * @type {Object}
   */
  httpConfig: {}
};
