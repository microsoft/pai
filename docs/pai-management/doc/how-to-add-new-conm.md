## How to add new service configuration into cluster-object-model

#### Index

- [ Overveiw ](#Over)
- [ Default Configuration ](#Default)
- [ overwrite Configuration ](#Overwrite)
- [ Service Parser ](#Service)
- [ Document ](#Document_link)
- [ How to write your template with cluster object model ](#use_link)


#### Overview <a name="Over"></a>

If you wanna add a new service configuration into cluster-object-model, you should do following things.

- Design and write a default service configuration.
- Design and write overwrite service configuration for user to reconfigure the service in service-configuration.yaml
- Design and write a service parser with python2.
- Write a document to introduce your service object model.


#### Default Configuration <a name="Default"></a>

###### Path

Please create the default configuration in the following path.

```bash
src/${service_name}/config/${service_name}.yaml
```


###### Format

${service_name}.yaml
```yaml
# The key `service_type` is designed for cluster-object-model. And don't use it in other place.
# Now, you could configure this key with one of ['yarn', 'common', 'k8s'].
# When service_type is yarn, the service's configuration will be generated if the cluster-type is yarn.
# When service_type is k8s, the service's configuration will be generated if the cluster-type is k8s.
# When service_type is common, the service's configuration will be generated in both of the cluster-type.
# If the key is missing, default value will be 'common'.
service_type: "yarn"

# key : value
service-a-key1: default—value1

service-a-key2: default-value2


service-a-key3:
    service-a-key3-subkey1: default-value3-subvalue1
    service-a-key3-subkey2: default-value3-subvalue2
    service-a-key3-subkey3: default-value3-subvalue3

service-a-key4:
    - default-value4-sub1
    - default-value4-sub2

```

#### overwrite Configuration <a name="Overwrite"></a>

- Reconfigure the default value
- Some properties is mandatory, user will have to configure it. Please put those configuration into the overwrite configuration in service-configuration.yaml

###### Update example/cluster-configuration

You should add the overwrite section in [example/service-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml)

Add the overwrite section of ```${service_name}``` like the following. Note, you could omit the default value which exists in default configuration.

```yaml
${service_name}:

  service-mandatory-key1: example-value1

  service-a-key1: default—value1

  service-a-key2: default-value2

  service-a-key3:
      service-a-key3-subkey1: default-value3-subvalue1
      service-a-key3-subkey2: default-value3-subvalue2
      service-a-key3-subkey3: default-value3-subvalue3

  service-a-key4:
      - default-value4-sub1
      - default-value4-sub2

```

###### Update deployment/quick-start/services-configuration.yaml.template

You should add the overwrite section in [deployment/quick-start/services-configuration.yaml.template](../../../deployment/quick-start/services-configuration.yaml.template)

Add the overwrite section of ```${service_name}``` like the following. Please omit the default value, and only left the mandatory value.

```yaml
${service_name}:
    service-mandatory-key1: usable-value1

```

#### Service Parser <a name="Service"></a>

###### path

Please create the service.parser in the following path.

```bash
src/${service_name}/config/${parser_name}.py
```

###### parser name

- Example 1
    - Service name: xxxxx
    - parse class name: xxxxx
- Example 2
    - Service name: xxx-yyy-zzz
    - parse class name: xxx_yyy_zzz


###### Class Name

- Example 1
    - Service name: xxxxx
    - parse class name: Xxxxx
- Example 2
    - Service name: xxx-yyy-zzz
    - parse class name: XxxYyyZzz


###### Specification

You should implement the parse class like following.

```python
class Cluster:

    def __init__(self, cluster_configuration, service_configuration, default_service_configuration):
        None

    #### Fist check, ensure all the configured data in cluster_configuration, service_configuration, default_service_configuration is right. And nothing is miss.
    def validation_pre(self):
        #   if error:
        #      return False, "message"

        return True, None

    #### Generate the final service object model
    def run(self):
        # parse your service object model here, and return a generated dictionary
        return cluster_com

    #### All service and main module (kubrenetes, machine) is generated. And in this check steps, you could refer to the service object model which you will used in your own service, and check its existence and correctness.
    def validation_post(self, cluster_object_model):
        #   if error:
        #      return False, "message"l
        return True, None
```

###### The generated service object model

Present python dict with yaml format

```yaml

service-generated-key1: generated-value1

service-mandatory-key1: example-value1

service-a-key1: default—value1

service-a-key2: default-value2

service-a-key3:
    service-a-key3-subkey1: default-value3-subvalue1
    service-a-key3-subkey2: default-value3-subvalue2
    service-a-key3-subkey3: default-value3-subvalue3

service-a-key4:
    - default-value4-sub1
    - default-value4-sub2

```

#### Document <a name="#Document_link"></a>

Please write a document to guide others to use the generated data of your service. The document should containers following information.

- Default configuration

Introduce your default configuration here.

- How to configure cluster section in service-configuration.yaml

Guide user to configure the mandatory properties and reconfigure the default.

- Generated Configuration

Present your generated data in yaml style

- Table

A table contain following content. Here I will take cluster section as an example.

<table>
<tr>
    <td>Data in Configuration File</td>
    <td>Data in Cluster Object Model</td>
    <td>Data in Jinja2 Template</td>
    <td>Data type</td>
</tr>
<tr>
    <td>cluster.common.cluster-id</td>
    <td>com["cluster"]["common"]["cluster-id"]</td>
    <td>cluster_cfg["cluster"]["common"]["cluster-id"]</td>
    <td>string</td>
</tr>
</table>

#### How to write your template with cluster object model <a name="#use_link"></a>


- You could find all service configuration in corresponding services' document in the path ```src/${service_name}/config/${service_name}.md```.
- Please refer to [jinja2 document](http://jinja.pocoo.org/docs/2.10/), and learn how to write the final template with the  ```Data in Jinja2 Template```