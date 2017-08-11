
const r = window['require'];
const noflo = r('noflo');
const nofloPostMessage = r('noflo-runtime-postmessage');

export function flowhubURL(runtimeId, options) {
  options = options || {};
  options.ide = options.ide || 'http://app.flowhub.io';
  const protocol = 'opener';
  const address = window.location.href
  const params = `protocol=${protocol}&address=${address}&id=${runtimeId}`;
  var debugUrl = options.ide+'#runtime/endpoint?'+encodeURIComponent(params);
  return debugUrl;
}

function createRuntime(libraryPrefix, options) {

  options = options || {};
  options.protocol = options.protocol || 'opener';

  if (options.id) {
    options.address = window.location.href;
  }

  var runtimeOptions = {
    baseDir: libraryPrefix,
    defaultPermissions: [
      'protocol:graph',
      'protocol:component',
      'protocol:network',
      'protocol:runtime',
      'component:getsource',
      'component:setsource'
    ]
  };

  if (options.graph) {
    runtimeOptions.defaultGraph = options.graph;
  }

  var runtime = null;
  if (options.protocol == 'opener') {
    runtime = nofloPostMessage.opener(runtimeOptions);
  } else if (options.protocol == 'iframe') {
    runtime = nofloPostMessage.iframe(runtimeOptions);
  }
  return runtime;
}

export function setupAndRun(options, callback) {
  options = options || {};
  const libraryPrefix = 'buildx-sprint';
  const mainGraph = 'main';

  const loader = new noflo.ComponentLoader(libraryPrefix);

  loader.load(mainGraph, function (err, instance) {
    if (err) { return callback(err); }

    instance.on('ready', function () {
      const graph = instance.network.graph;
      const runtime = createRuntime(libraryPrefix, { graph: graph, id: options.id });
      if (!runtime) {
        return callback(new Error('Unable to create a NoFlo runtime'));
      }
      runtime.start();
      setTimeout(() => {
        return callback(null, runtime);
      }, 100);
    });
  });
}

function sendTo(component, portName, data) {
  const socket = noflo.internalSocket.createSocket()
  const port = component.inPorts[portName]
  port.attach(socket);
  socket.send(data);
  port.detach(socket);
}

export function sendToInport(runtime, graphName, portName, data) {
  const graph = runtime.graph.graphs[graphName];
  const network = runtime.network.networks[graphName]
  if (!(graph && network)) {
    throw new Error("Could not find graph named " + graphName);
  }

  const internal = graph.inports[portName];
  if (!(internal && internal.process && internal.port)) {
    throw new Error("No exported port named " + portName);
  }

  const node = network.network.getNode(internal.process);
  if (!(node && node.component)) {
    throw new Error("Could not find node for exported port " + portName);
  }

  return sendTo(node.component, internal.port, data);  
}
