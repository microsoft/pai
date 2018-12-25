# TODO it's a dummy impl now
class CheckCmd():
    def register(self, check_parser):
        check_parser.add_argument("--pre", dest="pre", type=bool, default=False, help="Precheck. Check the prerequisites, and valid the configuration.")
        check_parser.add_argument("--config-path", dest="configPath", default="/cluster-configuration", help="Configuration path.")
        check_parser.set_defaults(handler=self.check)

    def check(self, args):
        import os
        # TODO now no options implemented
        print(args)
        layoutFile = os.path.join(args.configPath, "layout.yaml")
        serviceConfigFile = os.path.join(args.configPath, "service-configuration.yaml")
        print("layout.yaml existing:", os.path.exists(layoutFile))
        print("service-configuration.yaml existing:", os.path.exists(serviceConfigFile))
        # print("kubernetes ready:", True)
        # print("Configuration valid:", True)
